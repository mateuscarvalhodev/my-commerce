/**
 * AbacatePay API v2 client.
 *
 * Docs: https://docs.abacatepay.com
 *
 * Required env vars:
 *   ABACATEPAY_API_KEY  – Bearer token for authentication
 *
 * Optional:
 *   ABACATEPAY_WEBHOOK_SECRET – secret param appended to webhook URL for verification
 */

const ABACATEPAY_BASE_URL = "https://api.abacatepay.com/v2";

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
  taxId?: string; // CPF or CNPJ
}

export interface AbacateProduct {
  externalId: string;
  name: string;
  description?: string;
  price: number; // centavos
  quantity: number;
}

export interface CreateCustomerInput {
  email: string;
  name?: string;
  cellphone?: string;
  taxId?: string;
}

export interface CreateCustomerResponse {
  data: AbacateCustomer;
  success: boolean;
  error: string | null;
}

// ─── Checkout (hosted payment page) ──────────────────────────────────────────

export interface CreateCheckoutInput {
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  completionUrl?: string;
  metadata?: Record<string, string>;
}

export interface AbacateCheckout {
  id: string;
  url: string;
  amount: number;
  status: "PENDING" | "EXPIRED" | "CANCELLED" | "PAID" | "REFUNDED";
  devMode: boolean;
  customer: AbacateCustomer;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutResponse {
  data: AbacateCheckout;
  success: boolean;
  error: string | null;
}

// ─── Transparent PIX (QR Code direto) ────────────────────────────────────────

export interface CreatePixInput {
  amount: number; // centavos
  description?: string;
  expiresIn?: number; // seconds (default: 3600)
  customer?: {
    email: string;
    name?: string;
    taxId?: string;
    cellphone?: string;
  };
  metadata?: Record<string, string>;
}

export interface AbacatePixQrCode {
  id: string;
  amount: number;
  status: "PENDING" | "EXPIRED" | "CANCELLED" | "PAID" | "REFUNDED";
  brCode: string; // PIX copia-e-cola
  qrCodeUrl?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, string>;
}

export interface CreatePixResponse {
  data: AbacatePixQrCode;
  success: boolean;
  error: string | null;
}

export interface CheckPixResponse {
  data: AbacatePixQrCode;
  success: boolean;
  error: string | null;
}

// ─── Product ─────────────────────────────────────────────────────────────────

export interface CreateProductInput {
  externalId: string;
  name: string;
  description?: string;
  price: number; // centavos
  currency?: string;
}

export interface AbacateProductResponse {
  data: {
    id: string;
    externalId: string;
    name: string;
    price: number;
    status: string;
  };
  success: boolean;
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

// ─── API calls ───────────────────────────────────────────────────────────────

// Customers
export async function createCustomer(
  input: CreateCustomerInput
): Promise<CreateCustomerResponse> {
  return abacateRequest<CreateCustomerResponse>(
    "POST",
    "/customers/create",
    input
  );
}

export async function listCustomers() {
  return abacateRequest<{ data: AbacateCustomer[] }>("GET", "/customers/list");
}

// Products
export async function createProduct(
  input: CreateProductInput
): Promise<AbacateProductResponse> {
  return abacateRequest<AbacateProductResponse>(
    "POST",
    "/products/create",
    input
  );
}

// Checkouts (hosted payment page — PIX + Card)
export async function createCheckout(
  input: CreateCheckoutInput
): Promise<CreateCheckoutResponse> {
  return abacateRequest<CreateCheckoutResponse>(
    "POST",
    "/checkouts/create",
    input
  );
}

export async function getCheckout(
  checkoutId: string
): Promise<{ data: AbacateCheckout }> {
  return abacateRequest<{ data: AbacateCheckout }>(
    "GET",
    `/checkouts/get?id=${checkoutId}`
  );
}

// Transparent PIX (QR Code direto, sem checkout hospedado)
export async function createPixQrCode(
  input: CreatePixInput
): Promise<CreatePixResponse> {
  return abacateRequest<CreatePixResponse>("POST", "/transparents/create", input);
}

export async function checkPixStatus(
  pixId: string
): Promise<CheckPixResponse> {
  return abacateRequest<CheckPixResponse>(
    "GET",
    `/transparents/check?id=${pixId}`
  );
}

export async function simulatePixPayment(pixId: string) {
  return abacateRequest("POST", "/transparents/simulate-payment", {
    id: pixId,
  });
}

// ─── Webhook verification ────────────────────────────────────────────────────

/**
 * Verify AbacatePay webhook by checking the secret query parameter.
 *
 * AbacatePay recommends appending a secret to the webhook URL:
 *   https://your-site.com/api/webhooks/abacatepay?secret=YOUR_SECRET
 *
 * This function validates that parameter.
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
