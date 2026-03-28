import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/pagarme";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature") ?? "";

    if (signature && !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Assinatura invalida" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    if (!event?.type) {
      return NextResponse.json({ error: "Evento invalido" }, { status: 400 });
    }

    const supabase = createAdminClient();

    if (event.type === "charge.paid" || event.type === "order.paid") {
      await handlePaymentConfirmed(supabase, event.data);
    } else if (event.type === "charge.payment_failed" || event.type === "order.payment_failed") {
      await handlePaymentFailed(supabase, event.data);
    } else if (event.type === "charge.refunded") {
      await handlePaymentRefunded(supabase, event.data);
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true, error: "processing_error" });
  }
}

async function findPayment(supabase: ReturnType<typeof createAdminClient>, data: any) {
  if (data.id) {
    const { data: p } = await supabase.from("payments").select().eq("gateway_id", data.id).single();
    if (p) return p;
  }
  const orderId = data.metadata?.order_id ?? data.order?.metadata?.order_id;
  if (orderId) {
    const { data: p } = await supabase
      .from("payments").select().eq("order_id", orderId)
      .order("created_at", { ascending: false }).limit(1).single();
    if (p) return p;
  }
  return null;
}

async function handlePaymentConfirmed(supabase: ReturnType<typeof createAdminClient>, data: any) {
  const payment = await findPayment(supabase, data);
  if (!payment || payment.status === "paid") return;

  await supabase.from("payments").update({
    status: "paid",
    gateway_status: data.status ?? "paid",
    paid_at: new Date().toISOString(),
  }).eq("id", payment.id);

  await supabase.from("orders").update({ status: "paid" }).eq("id", payment.order_id).eq("status", "pending");
}

async function handlePaymentFailed(supabase: ReturnType<typeof createAdminClient>, data: any) {
  const payment = await findPayment(supabase, data);
  if (!payment || payment.status === "paid") return;

  await supabase.from("payments").update({
    status: "failed",
    gateway_status: data.status ?? "failed",
    error_message: data.last_transaction?.gateway_response?.errors?.[0]?.message ?? "Pagamento recusado",
  }).eq("id", payment.id);
}

async function handlePaymentRefunded(supabase: ReturnType<typeof createAdminClient>, data: any) {
  const payment = await findPayment(supabase, data);
  if (!payment) return;

  await supabase.from("payments").update({
    status: "refunded",
    gateway_status: data.status ?? "refunded",
  }).eq("id", payment.id);
}
