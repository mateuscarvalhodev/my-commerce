"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createCustomer,
  createPixQrCode,
  createBilling,
  checkPixStatus,
  type AbacatePixQrCode,
  type AbacateBilling,
} from "@/lib/abacatepay";

interface PixPaymentData {
  method: "pix";
  expiresIn?: number;
}

interface BillingPaymentData {
  method: "billing"; // Hosted billing link (PIX via AbacatePay page)
}

type PaymentData = PixPaymentData | BillingPaymentData;

export async function createPayment(data: {
  orderId: string;
  customer: {
    email?: string;
    taxId?: string;
    name?: string;
    cellphone?: string;
  };
  payment: PaymentData;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  // Get order with items
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*, order_items(*, product:products(*))")
    .eq("id", data.orderId)
    .eq("user_id", user.id)
    .single();

  if (orderError || !order) throw new Error("Pedido não encontrado");
  if (order.status !== "pending") throw new Error("Pedido não está pendente");

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const customerEmail = data.customer.email || user.email || "";
  const customerName = data.customer.name || profile?.name || "Cliente";
  const amountCents = Math.round(Number(order.total) * 100);

  // Create customer in AbacatePay
  const customerRes = await createCustomer({
    email: customerEmail,
    name: customerName,
    taxId: data.customer.taxId,
    cellphone: data.customer.cellphone,
  });

  let paymentRecord: Record<string, unknown> = {
    order_id: order.id,
    amount_cents: amountCents,
  };

  if (data.payment.method === "pix") {
    // ─── PIX QR Code (transparente) ───────────────────────────────────
    const pixRes = await createPixQrCode({
      amount: amountCents,
      description: `Pedido #${order.id.slice(0, 8)}`,
      expiresIn: data.payment.expiresIn ?? 3600,
      metadata: { order_id: order.id },
    });

    const pix: AbacatePixQrCode = pixRes.data;

    paymentRecord = {
      ...paymentRecord,
      method: "pix",
      status: pix.status === "PAID" ? "paid" : "waiting_payment",
      gateway_id: pix.id,
      gateway_status: pix.status,
      pix_qr_code: pix.brCode,
      pix_qr_code_url: pix.qrCodeUrl ?? null,
      pix_expires_at: pix.expiresAt ?? null,
      gateway_response: pixRes as unknown as Record<string, unknown>,
    };
  } else {
    // ─── Billing link (página hospedada do AbacatePay) ────────────────
    const products = (order.order_items as any[]).map((item: any) => ({
      externalId: item.product_id,
      name: item.product?.name ?? `Produto ${item.product_id.slice(0, 8)}`,
      quantity: item.quantity,
      price: Math.round(Number(item.unit_price) * 100),
    }));

    const completionUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/checkout/payment/${order.id}`;

    const billingRes = await createBilling({
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products,
      completionUrl,
      customerId: customerRes.data.id,
      metadata: { order_id: order.id },
    });

    const billing: AbacateBilling = billingRes.data;

    paymentRecord = {
      ...paymentRecord,
      method: "pix",
      status: billing.status === "PAID" ? "paid" : "waiting_payment",
      gateway_id: billing.id,
      gateway_status: billing.status,
      boleto_url: billing.url, // reuse field for billing link
      gateway_response: billingRes as unknown as Record<string, unknown>,
    };
  }

  // Save payment in DB
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert(paymentRecord)
    .select()
    .single();

  if (paymentError) throw new Error("Erro ao salvar pagamento");

  // Update order
  await supabase
    .from("orders")
    .update({
      payment_id: payment.id,
      gateway_order_id: paymentRecord.gateway_id as string,
      payment_method: data.payment.method === "pix" ? "pix" : "billing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  return payment;
}

export async function getPaymentByOrder(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (!order) throw new Error("Pedido não encontrado");

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) throw new Error(error.message);

  // If PIX, poll AbacatePay for updated status
  if (data?.method === "pix" && data?.gateway_id && data?.status !== "paid") {
    try {
      const statusRes = await checkPixStatus(data.gateway_id);
      const newStatus = statusRes.data.status;

      if (newStatus === "PAID" && data.status !== "paid") {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const admin = createAdminClient();

        await admin
          .from("payments")
          .update({
            status: "paid",
            gateway_status: newStatus,
            paid_at: new Date().toISOString(),
          })
          .eq("id", data.id);

        await admin
          .from("orders")
          .update({ status: "paid" })
          .eq("id", orderId)
          .eq("status", "pending");

        data.status = "paid";
        data.paid_at = new Date().toISOString();
      }
    } catch {
      // Ignore polling errors
    }
  }

  return data;
}
