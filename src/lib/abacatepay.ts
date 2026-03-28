/**
 * AbacatePay API v1 client.
 *
 * Docs: https://docs.abacatepay.com
 * OpenAPI: https://docs.abacatepay.com/openapi-v1.yaml
 *
 * Required env vars:
 *   ABACATEPAY_API_KEY  – Bearer token for authentication
 *
 * Optional:
 *   ABACATEPAY_WEBHOOK_SECRET – secret param appended to webhook URL for verification
 */

const ABACATEPAY_BASE_URL = "https://api.abacatepay.com/v1";

function getApiKey(): string {
  const key = process.env.ABACATEPAY_API_KEY;
  if (!key) throw new Error("ABACATEPAY_API_KEY não configurada");
  return key;
}

// ─── Generic request helper ───────────────────────────────────────────────────

async function abacateRequest<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${ABACATEPAY_BASE_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json()) as any;

  if (!res.ok || data?.error) {
    console.error("[AbacatePay] API error", {
      status: res.status,
      url,
      body: data,
    });
    throw new Error(data?.error ?? `AbacatePay HTTP ${res.status}`);
  }

  return data as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AbacateCustomer {
  id?: string;
  email: string;
  name?: string;
  cellphone?: string;
  taxId?: string;
}

// ─── Customer ────────────────────────────────────────────────────────────────

export interface CreateCustomerInput {
  name: string;
  cellphone: string;
  email: string;
  taxId: string;
}

export interface CreateCustomerResponse {
  data: AbacateCustomer;
  error: string | null;
}

// ─── Billing (cobranças/checkout) ────────────────────────────────────────────

export type BillingFrequency = "ONE_TIME" | "MULTIPLE_PAYMENTS";
export type BillingMethod = "PIX" | "CARD";
export type BillingStatus = "PENDING" | "EXPIRED" | "CANCELLED" | "PAID" | "REFUNDED";

export interface BillingProduct {
  externalId: string;
  name: string;
  description?: string;
  quantity: number;
  price: number; // centavos
}

export interface CreateBillingInput {
  frequency: BillingFrequency;
  methods: BillingMethod[];
  products: BillingProduct[];
  returnUrl: string;
  completionUrl: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface AbacateBilling {
  id: string;
  url: string;
  amount: number;
  status: BillingStatus;
  devMode: boolean;
  customer?: AbacateCustomer;
  products: BillingProduct[];
  frequency: BillingFrequency;
  methods: BillingMethod[];
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBillingResponse {
  data: AbacateBilling;
  error: string | null;
}

// ─── PIX QR Code (transparente) ──────────────────────────────────────────────

export interface CreatePixInput {
  amount: number; // centavos
  description?: string;
  expiresIn?: number; // seconds
  metadata?: Record<string, string>;
}

export interface AbacatePixQrCode {
  id: string;
  amount: number;
  status: "PENDING" | "EXPIRED" | "CANCELLED" | "PAID" | "REFUNDED";
  brCode: string;
  qrCodeUrl?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, string>;
}

export interface CreatePixResponse {
  data: AbacatePixQrCode;
  error: string | null;
}

export interface CheckPixResponse {
  data: AbacatePixQrCode;
  error: string | null;
}

// ─── Webhook types ───────────────────────────────────────────────────────────

export interface AbacateWebhookEvent {
  event:
    | "billing.created"
    | "billing.paid"
    | "billing.refunded"
    | "billing.failed"
    | "subscription.created"
    | "subscription.canceled";
  devMode: boolean;
  data: {
    id: string;
    externalId?: string;
    amount: number;
    paidAmount?: number;
    status: string;
    customer?: {
      id: string;
      email: string;
    };
    metadata?: Record<string, string>;
    createdAt: string;
    updatedAt: string;
  };
}

// ─── API calls (v1 endpoints) ────────────────────────────────────────────────

// Customer
export async function createCustomer(
  input: CreateCustomerInput
): Promise<CreateCustomerResponse> {
  return abacateRequest<CreateCustomerResponse>(
    "POST",
    "/customer/create",
    input
  );
}

export async function listCustomers() {
  return abacateRequest<{ data: AbacateCustomer[] }>("GET", "/customer/list");
}

// Billing (cobranças com link de pagamento)
export async function createBilling(
  input: CreateBillingInput
): Promise<CreateBillingResponse> {
  return abacateRequest<CreateBillingResponse>(
    "POST",
    "/billing/create",
    input
  );
}

export async function listBillings() {
  return abacateRequest<{ data: AbacateBilling[] }>("GET", "/billing/list");
}

// PIX QR Code (transparente)
export async function createPixQrCode(
  input: CreatePixInput
): Promise<CreatePixResponse> {
  return abacateRequest<CreatePixResponse>("POST", "/pixQrCode/create", input);
}

export async function checkPixStatus(
  pixId: string
): Promise<CheckPixResponse> {
  return abacateRequest<CheckPixResponse>(
    "GET",
    `/pixQrCode/check?id=${pixId}`
  );
}

export async function simulatePixPayment(pixId: string) {
  return abacateRequest("POST", `/pixQrCode/simulate-payment?id=${encodeURIComponent(pixId)}`, {});
}

// ─── Webhook verification ────────────────────────────────────────────────────

/**
 * Verify AbacatePay webhook by checking the secret query parameter.
 * Append ?secret=YOUR_SECRET to the webhook URL when configuring.
 */
export function verifyWebhookSecret(receivedSecret: string | null): boolean {
  const expected = process.env.ABACATEPAY_WEBHOOK_SECRET;
  if (!expected) {
    console.warn(
      "[AbacatePay] ABACATEPAY_WEBHOOK_SECRET não configurada — pulando verificação"
    );
    return true;
  }
  return receivedSecret === expected;
}
