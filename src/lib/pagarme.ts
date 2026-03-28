/**
 * Pagar.me API v5 client.
 *
 * Docs: https://docs.pagar.me/reference
 *
 * Required env vars:
 *   PAGARME_SECRET_KEY  - sk_test_... or sk_...
 *
 * Optional:
 *   PAGARME_WEBHOOK_SECRET - used to verify webhook signatures
 */

import crypto from 'crypto';

const PAGARME_BASE_URL = 'https://api.pagar.me/core/v5';

function getSecretKey(): string {
  const key = process.env.PAGARME_SECRET_KEY;
  if (!key) throw new Error('PAGARME_SECRET_KEY not configured');
  return key;
}

function authHeader(): string {
  return 'Basic ' + Buffer.from(`${getSecretKey()}:`).toString('base64');
}

// --- Generic request helper --------------------------------------------------

async function pagarmeRequest<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${PAGARME_BASE_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json()) as any;

  if (!res.ok) {
    console.error('[Pagar.me] API error', {
      status: res.status,
      url,
      body: data,
    });
    const msg =
      data?.message ?? data?.errors?.[0]?.message ?? 'Erro na API do Pagar.me';
    throw new Error(msg);
  }

  return data as T;
}

// --- Types -------------------------------------------------------------------

export interface PagarmeCustomer {
  name: string;
  email: string;
  document: string; // CPF (11 digits) or CNPJ (14 digits)
  document_type: 'CPF' | 'CNPJ';
  type: 'individual' | 'company';
  phones?: {
    mobile_phone?: {
      country_code: string;
      area_code: string;
      number: string;
    };
  };
}

export interface PagarmeAddress {
  line_1: string; // "number, street, complement"
  line_2?: string; // neighborhood
  zip_code: string;
  city: string;
  state: string;
  country: string;
}

export interface PagarmeOrderItem {
  amount: number; // centavos
  description: string;
  quantity: number;
  code?: string;
}

export interface PagarmeCreditCardPayment {
  payment_method: 'credit_card';
  credit_card: {
    installments: number;
    card: {
      number: string;
      holder_name: string;
      exp_month: number;
      exp_year: number;
      cvv: string;
      billing_address: PagarmeAddress;
    };
  };
}

export interface PagarmePixPayment {
  payment_method: 'pix';
  pix: {
    expires_in: number; // seconds until expiry (e.g. 3600 = 1h)
  };
}

export interface PagarmeBoletoPayment {
  payment_method: 'boleto';
  boleto: {
    instructions: string;
    due_at: string; // ISO date e.g. "2026-04-03T23:59:59Z"
  };
}

export type PagarmePaymentConfig =
  | PagarmeCreditCardPayment
  | PagarmePixPayment
  | PagarmeBoletoPayment;

export interface CreatePagarmeOrderInput {
  customer: PagarmeCustomer;
  shipping?: {
    amount: number;
    address: PagarmeAddress;
    description?: string;
  };
  items: PagarmeOrderItem[];
  payments: PagarmePaymentConfig[];
  metadata?: Record<string, string>;
}

// --- Pagar.me response types (partial) ---------------------------------------

export interface PagarmeCharge {
  id: string;
  code: string;
  amount: number;
  status: string;
  payment_method: string;
  last_transaction?: {
    id: string;
    status: string;
    qr_code?: string;
    qr_code_url?: string;
    expires_at?: string;
    url?: string;
    barcode?: string;
    due_at?: string;
    card?: {
      last_four_digits?: string;
      brand?: string;
    };
    installments?: number;
    gateway_response?: Record<string, unknown>;
  };
  created_at: string;
  updated_at: string;
}

export interface PagarmeOrder {
  id: string;
  code: string;
  amount: number;
  status: string;
  charges: PagarmeCharge[];
  created_at: string;
  closed: boolean;
  metadata?: Record<string, string>;
}

// --- API calls ---------------------------------------------------------------

export async function createOrder(
  input: CreatePagarmeOrderInput
): Promise<PagarmeOrder> {
  return pagarmeRequest<PagarmeOrder>('POST', '/orders', input);
}

export async function getOrder(orderId: string): Promise<PagarmeOrder> {
  return pagarmeRequest<PagarmeOrder>('GET', `/orders/${orderId}`);
}

export async function getCharge(chargeId: string): Promise<PagarmeCharge> {
  return pagarmeRequest<PagarmeCharge>('GET', `/charges/${chargeId}`);
}

// --- Webhook signature verification ------------------------------------------

/**
 * Verify the Pagar.me webhook HMAC-SHA256 signature.
 *
 * Pagar.me sends the signature in the `x-hub-signature` header as:
 *   sha256=<hex>
 *
 * If PAGARME_WEBHOOK_SECRET is not configured, verification is skipped
 * (dev mode convenience).
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string
): boolean {
  const secret = process.env.PAGARME_WEBHOOK_SECRET;
  if (!secret) {
    console.warn(
      '[Pagar.me] PAGARME_WEBHOOK_SECRET not configured - skipping verification'
    );
    return true;
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const received = signatureHeader.replace('sha256=', '');

  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(received, 'hex')
  );
}
