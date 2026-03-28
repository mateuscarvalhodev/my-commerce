/**
 * Woovi (OpenPix) API v1 client.
 *
 * Docs: https://developers.woovi.com
 *
 * Required env vars:
 *   WOOVI_APP_ID – AppID gerado no painel Woovi
 *
 * Optional:
 *   WOOVI_WEBHOOK_SECRET – HMAC secret para verificar webhooks
 */

import crypto from "crypto";

const WOOVI_BASE_URL = "https://api.woovi.com/api/v1";

function getAppId(): string {
  const key = process.env.WOOVI_APP_ID;
  if (!key) throw new Error("WOOVI_APP_ID não configurada");
  return key;
}

// ─── Generic request helper ───────────────────────────────────────────────────

async function wooviRequest<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${WOOVI_BASE_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: getAppId(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json()) as any;

  if (!res.ok) {
    console.error("[Woovi] API error", {
      status: res.status,
      url,
      body: data,
    });
    const msg =
      data?.errors?.[0]?.message ?? data?.error ?? `Woovi HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WooviCharge {
  correlationID: string;
  value: number; // centavos
  status: "ACTIVE" | "COMPLETED" | "EXPIRED";
  brCode: string;
  qrCodeImage: string;
  paymentLinkUrl: string;
  pixKey: string;
  globalID: string;
  transactionID?: string;
  expiresDate?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  comment?: string;
  customer?: {
    name?: string;
    email?: string;
    taxID?: string;
    phone?: string;
  };
  additionalInfo?: Array<{ key: string; value: string }>;
}

export interface CreateChargeInput {
  value: number; // centavos
  correlationID: string;
  comment?: string;
  expiresIn?: number; // seconds
  customer?: {
    name?: string;
    email?: string;
    taxID?: string;
    phone?: string;
  };
  additionalInfo?: Array<{ key: string; value: string }>;
}

export interface CreateChargeResponse {
  charge: WooviCharge;
  correlationID: string;
  brCode: string;
}

export interface GetChargeResponse {
  charge: WooviCharge;
}

// ─── Webhook types ───────────────────────────────────────────────────────────

export interface WooviWebhookPayload {
  event:
    | "OPENPIX:CHARGE_COMPLETED"
    | "OPENPIX:CHARGE_CREATED"
    | "OPENPIX:CHARGE_EXPIRED"
    | "OPENPIX:TRANSACTION_RECEIVED"
    | "OPENPIX:TRANSACTION_REFUND_RECEIVED";
  charge?: WooviCharge;
  pix?: {
    charge?: { correlationID: string };
    value: number;
    time: string;
    transactionID: string;
  };
}

// ─── API calls ───────────────────────────────────────────────────────────────

/**
 * Criar cobrança PIX.
 * POST /charge
 */
export async function createCharge(
  input: CreateChargeInput
): Promise<CreateChargeResponse> {
  return wooviRequest<CreateChargeResponse>("POST", "/charge", input);
}

/**
 * Consultar cobrança por correlationID.
 * GET /charge/:correlationID
 */
export async function getCharge(
  correlationID: string
): Promise<GetChargeResponse> {
  return wooviRequest<GetChargeResponse>("GET", `/charge/${correlationID}`);
}

/**
 * Listar cobranças.
 * GET /charge
 */
export async function listCharges(): Promise<{ charges: WooviCharge[] }> {
  return wooviRequest<{ charges: WooviCharge[] }>("GET", "/charge");
}

// ─── Webhook signature verification ──────────────────────────────────────────

/**
 * Verify Woovi webhook HMAC-SHA256 signature.
 *
 * Woovi sends the signature in the `x-webhook-secret` header.
 * The HMAC is computed over the raw body using WOOVI_WEBHOOK_SECRET.
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string
): boolean {
  const secret = process.env.WOOVI_WEBHOOK_SECRET;
  if (!secret) {
    console.warn(
      "[Woovi] WOOVI_WEBHOOK_SECRET não configurada — pulando verificação"
    );
    return true;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signatureHeader, "hex")
    );
  } catch {
    return false;
  }
}
