import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, type WooviWebhookPayload } from "@/lib/woovi";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-webhook-secret") ?? "";

    if (signature && !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { error: "Assinatura inválida" },
        { status: 401 }
      );
    }

    const payload: WooviWebhookPayload = JSON.parse(rawBody);

    if (!payload?.event) {
      return NextResponse.json({ error: "Evento inválido" }, { status: 400 });
    }

    const supabase = createAdminClient();

    switch (payload.event) {
      case "OPENPIX:CHARGE_COMPLETED":
        await handleChargeCompleted(supabase, payload);
        break;
      case "OPENPIX:CHARGE_EXPIRED":
        await handleChargeExpired(supabase, payload);
        break;
      case "OPENPIX:TRANSACTION_REFUND_RECEIVED":
        await handleRefund(supabase, payload);
        break;
      default:
        console.log(`[Woovi] Evento não tratado: ${payload.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Woovi] Webhook error:", err);
    return NextResponse.json({ received: true, error: "processing_error" });
  }
}

async function findPayment(
  supabase: ReturnType<typeof createAdminClient>,
  correlationID?: string
) {
  if (!correlationID) return null;

  // correlationID = order_id stored as gateway_id
  const { data } = await supabase
    .from("payments")
    .select()
    .eq("gateway_id", correlationID)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data;
}

async function handleChargeCompleted(
  supabase: ReturnType<typeof createAdminClient>,
  payload: WooviWebhookPayload
) {
  const correlationID =
    payload.charge?.correlationID ?? payload.pix?.charge?.correlationID;
  const payment = await findPayment(supabase, correlationID);
  if (!payment || payment.status === "paid") return;

  await supabase
    .from("payments")
    .update({
      status: "paid",
      gateway_status: "COMPLETED",
      paid_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  await supabase
    .from("orders")
    .update({ status: "paid" })
    .eq("id", payment.order_id)
    .eq("status", "pending");

  console.log(`[Woovi] Pagamento confirmado: ${payment.id}`);
}

async function handleChargeExpired(
  supabase: ReturnType<typeof createAdminClient>,
  payload: WooviWebhookPayload
) {
  const correlationID = payload.charge?.correlationID;
  const payment = await findPayment(supabase, correlationID);
  if (!payment || payment.status === "paid") return;

  await supabase
    .from("payments")
    .update({
      status: "failed",
      gateway_status: "EXPIRED",
      error_message: "Cobrança PIX expirada",
    })
    .eq("id", payment.id);
}

async function handleRefund(
  supabase: ReturnType<typeof createAdminClient>,
  payload: WooviWebhookPayload
) {
  const correlationID = payload.pix?.charge?.correlationID;
  const payment = await findPayment(supabase, correlationID);
  if (!payment) return;

  await supabase
    .from("payments")
    .update({
      status: "refunded",
      gateway_status: "REFUNDED",
    })
    .eq("id", payment.id);
}
