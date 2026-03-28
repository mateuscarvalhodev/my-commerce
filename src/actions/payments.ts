"use server";

import { createClient } from "@/lib/supabase/server";
import { createCharge, getCharge } from "@/lib/woovi";

export async function createPayment(data: {
  orderId: string;
  customer?: {
    taxId?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  // Get order
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

  const amountCents = Math.round(Number(order.total) * 100);

  // Create PIX charge via Woovi
  const chargeRes = await createCharge({
    value: amountCents,
    correlationID: order.id, // use order ID as correlation
    comment: `Pedido #${order.id.slice(0, 8)}`,
    expiresIn: 3600,
    customer: {
      name: data.customer?.name || profile?.name || undefined,
      email: data.customer?.email || user.email || undefined,
      taxID: data.customer?.taxId || undefined,
      phone: data.customer?.phone || undefined,
    },
    additionalInfo: [
      { key: "order_id", value: order.id },
    ],
  });

  const charge = chargeRes.charge;

  // Save payment in DB
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      order_id: order.id,
      method: "pix",
      amount_cents: amountCents,
      status: charge.status === "COMPLETED" ? "paid" : "waiting_payment",
      gateway_id: charge.correlationID,
      gateway_status: charge.status,
      pix_qr_code: charge.brCode,
      pix_qr_code_url: charge.qrCodeImage,
      pix_expires_at: charge.expiresDate ?? null,
      boleto_url: charge.paymentLinkUrl, // reuse field for payment link
      gateway_response: chargeRes as unknown as Record<string, unknown>,
    })
    .select()
    .single();

  if (paymentError) throw new Error("Erro ao salvar pagamento");

  // Update order
  await supabase
    .from("orders")
    .update({
      payment_id: payment.id,
      gateway_order_id: charge.correlationID,
      payment_method: "pix",
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

  // Poll Woovi for real-time status
  if (data?.gateway_id && data?.status !== "paid") {
    try {
      const chargeRes = await getCharge(data.gateway_id);
      const newStatus = chargeRes.charge.status;

      if (newStatus === "COMPLETED" && data.status !== "paid") {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const admin = createAdminClient();

        await admin
          .from("payments")
          .update({
            status: "paid",
            gateway_status: "COMPLETED",
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
