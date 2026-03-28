"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createOrder as createPagarmeOrder,
  type PagarmeCustomer,
  type PagarmeOrderItem,
  type PagarmePaymentConfig,
} from "@/lib/pagarme";

interface PixPaymentData {
  method: "pix";
  expiresIn?: number;
}

interface BoletoPaymentData {
  method: "boleto";
  instructions?: string;
  dueAt?: string;
}

interface CreditCardPaymentData {
  method: "credit_card";
  installments: number;
  card: {
    number: string;
    holderName: string;
    expMonth: number;
    expYear: number;
    cvv: string;
    billingAddress: {
      line1: string;
      line2?: string;
      zipCode: string;
      city: string;
      state: string;
      country: string;
    };
  };
}

type PaymentData = PixPaymentData | BoletoPaymentData | CreditCardPaymentData;

export async function createPayment(data: {
  orderId: string;
  customer: {
    document: string;
    documentType?: "CPF" | "CNPJ";
  };
  payment: PaymentData;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nao autenticado");

  // Get order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*, order_items(*, product:products(*))")
    .eq("id", data.orderId)
    .eq("user_id", user.id)
    .single();

  if (orderError || !order) throw new Error("Pedido nao encontrado");

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Build Pagar.me customer
  const docType = data.customer.documentType ?? "CPF";
  const pagarmeCustomer: PagarmeCustomer = {
    name: profile?.name || user.email || "Cliente",
    email: user.email || "",
    document: data.customer.document,
    document_type: docType,
    type: docType === "CPF" ? "individual" : "company",
  };

  // Build Pagar.me items
  const pagarmeItems: PagarmeOrderItem[] = order.order_items.map(
    (item: any) => ({
      amount: Math.round(Number(item.unit_price) * 100),
      description: item.product.name,
      quantity: item.quantity,
      code: item.product_id,
    })
  );

  // Build payment config
  let paymentConfig: PagarmePaymentConfig;

  switch (data.payment.method) {
    case "pix":
      paymentConfig = {
        payment_method: "pix",
        pix: {
          expires_in: data.payment.expiresIn ?? 3600,
        },
      };
      break;
    case "boleto":
      paymentConfig = {
        payment_method: "boleto",
        boleto: {
          instructions:
            data.payment.instructions ?? "Pagar ate o vencimento",
          due_at:
            data.payment.dueAt ??
            new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };
      break;
    case "credit_card":
      paymentConfig = {
        payment_method: "credit_card",
        credit_card: {
          installments: data.payment.installments,
          card: {
            number: data.payment.card.number,
            holder_name: data.payment.card.holderName,
            exp_month: data.payment.card.expMonth,
            exp_year: data.payment.card.expYear,
            cvv: data.payment.card.cvv,
            billing_address: {
              line_1: data.payment.card.billingAddress.line1,
              line_2: data.payment.card.billingAddress.line2,
              zip_code: data.payment.card.billingAddress.zipCode,
              city: data.payment.card.billingAddress.city,
              state: data.payment.card.billingAddress.state,
              country: data.payment.card.billingAddress.country,
            },
          },
        },
      };
      break;
    default:
      throw new Error("Metodo de pagamento invalido");
  }

  // Call Pagar.me API
  const pagarmeOrder = await createPagarmeOrder({
    customer: pagarmeCustomer,
    items: pagarmeItems,
    payments: [paymentConfig],
    metadata: {
      order_id: order.id,
    },
  });

  const charge = pagarmeOrder.charges?.[0];
  const lastTransaction = charge?.last_transaction;

  // Save payment record in DB
  const paymentRecord: Record<string, unknown> = {
    order_id: order.id,
    status: charge?.status ?? "pending",
    method: data.payment.method,
    amount_cents: Math.round(Number(order.total) * 100),
    gateway_id: charge?.id ?? null,
    gateway_status: charge?.status ?? null,
    gateway_response: pagarmeOrder as unknown as Record<string, unknown>,
  };

  // Add method-specific fields
  if (data.payment.method === "pix") {
    paymentRecord.pix_qr_code = lastTransaction?.qr_code ?? null;
    paymentRecord.pix_qr_code_url = lastTransaction?.qr_code_url ?? null;
    paymentRecord.pix_expires_at = lastTransaction?.expires_at ?? null;
  } else if (data.payment.method === "boleto") {
    paymentRecord.boleto_url = lastTransaction?.url ?? null;
    paymentRecord.boleto_barcode = lastTransaction?.barcode ?? null;
    paymentRecord.boleto_due_date = lastTransaction?.due_at ?? null;
  } else if (data.payment.method === "credit_card") {
    paymentRecord.card_last_digits =
      lastTransaction?.card?.last_four_digits ?? null;
    paymentRecord.card_brand = lastTransaction?.card?.brand ?? null;
    paymentRecord.installments = lastTransaction?.installments ?? 1;
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert(paymentRecord)
    .select()
    .single();

  if (paymentError) throw new Error("Erro ao salvar pagamento");

  // Update order with payment_id and gateway_order_id
  await supabase
    .from("orders")
    .update({
      payment_id: payment.id,
      gateway_order_id: pagarmeOrder.id,
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
  if (!user) throw new Error("Nao autenticado");

  // Verify user owns the order
  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (!order) throw new Error("Pedido nao encontrado");

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) throw new Error(error.message);

  return data;
}
