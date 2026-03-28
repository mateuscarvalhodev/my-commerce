import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSecret,
  type AbacateWebhookEvent,
} from "@/lib/abacatepay";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret via query param
    const secret = request.nextUrl.searchParams.get("secret");
    if (!verifyWebhookSecret(secret)) {
      return NextResponse.json(
        { error: "Secret inválido" },
        { status: 401 }
      );
    }

    const event: AbacateWebhookEvent = await request.json();

    if (!event?.event) {
      return NextResponse.json({ error: "Evento inválido" }, { status: 400 });
    }

    const supabase = createAdminClient();

    switch (event.event) {
      case "billing.paid":
        await handleBillingPaid(supabase, event.data);
        break;
      case "billing.failed":
        await handleBillingFailed(supabase, event.data);
        break;
      case "billing.refunded":
        await handleBillingRefunded(supabase, event.data);
        break;
      default:
        console.log(`[AbacatePay] Evento não tratado: ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[AbacatePay] Webhook error:", err);
    return NextResponse.json({ received: true, error: "processing_error" });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function findPayment(
  supabase: ReturnType<typeof createAdminClient>,
  data: AbacateWebhookEvent["data"]
) {
  // Try by gateway_id (AbacatePay billing/checkout ID)
  if (data.id) {
    const { data: p } = await supabase
      .from("payments")
      .select()
      .eq("gateway_id", data.id)
      .single();
    if (p) return p;
  }

  // Try by metadata.order_id
  const orderId = data.metadata?.order_id;
  if (orderId) {
    const { data: p } = await supabase
      .from("payments")
      .select()
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (p) return p;
  }

  return null;
}

async function handleBillingPaid(
  supabase: ReturnType<typeof createAdminClient>,
  data: AbacateWebhookEvent["data"]
) {
  const payment = await findPayment(supabase, data);
  if (!payment || payment.status === "paid") return;

  await supabase
    .from("payments")
    .update({
      status: "paid",
      gateway_status: data.status,
      paid_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  await supabase
    .from("orders")
    .update({ status: "paid" })
    .eq("id", payment.order_id)
    .eq("status", "pending");
}

async function handleBillingFailed(
  supabase: ReturnType<typeof createAdminClient>,
  data: AbacateWebhookEvent["data"]
) {
  const payment = await findPayment(supabase, data);
  if (!payment || payment.status === "paid") return;

  await supabase
    .from("payments")
    .update({
      status: "failed",
      gateway_status: data.status,
      error_message: "Pagamento recusado",
    })
    .eq("id", payment.id);
}

async function handleBillingRefunded(
  supabase: ReturnType<typeof createAdminClient>,
  data: AbacateWebhookEvent["data"]
) {
  const payment = await findPayment(supabase, data);
  if (!payment) return;

  await supabase
    .from("payments")
    .update({
      status: "refunded",
      gateway_status: data.status,
    })
    .eq("id", payment.id);
}
