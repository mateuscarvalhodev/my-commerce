/**
 * Shipping calculator with Correios API integration + local fallback.
 *
 * Uses the Correios public web service for price/deadline calculation.
 * Falls back to a deterministic rule-based estimate when the API is unavailable.
 *
 * Correios service codes:
 *   04014 = SEDEX
 *   04510 = PAC
 *   04782 = SEDEX 12
 *   04790 = SEDEX 10
 *   40215 = SEDEX Hoje (same-day in some capitals)
 */

// --- Types -------------------------------------------------------------------

export interface ShippingOption {
  service_code: string;
  service_name: string;
  price: number;
  deadline_days: number;
  error?: string;
}

export interface ShippingQuoteInput {
  origin_cep: string;
  destination_cep: string;
  weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  order_value: number;
}

export interface ShippingQuoteResult {
  options: ShippingOption[];
  source: 'correios' | 'fallback';
}

// --- Correios service mapping ------------------------------------------------

const CORREIOS_SERVICES: Record<string, string> = {
  '04014': 'SEDEX',
  '04510': 'PAC',
  '04782': 'SEDEX 12',
  '04790': 'SEDEX 10',
};

// Default services to quote
const DEFAULT_SERVICE_CODES = ['04014', '04510'];

// Default origin CEP (store's address) - overridable via env
const DEFAULT_ORIGIN_CEP = process.env.STORE_CEP || '01001000';

// Free shipping threshold (R$)
const FREE_SHIPPING_ABOVE = Number(process.env.FREE_SHIPPING_ABOVE) || 299;

// --- Correios API ------------------------------------------------------------

const CORREIOS_CALC_URL =
  'http://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx';

interface CorreiosApiParams {
  nCdEmpresa: string;
  sDsSenha: string;
  nCdServico: string;
  sCepOrigem: string;
  sCepDestino: string;
  nVlPeso: string;
  nCdFormato: string;
  nVlComprimento: string;
  nVlAltura: string;
  nVlLargura: string;
  nVlDiametro: string;
  sCdMaoPropria: string;
  nVlValorDeclarado: string;
  sCdAvisoRecebimento: string;
  StrRetorno: string;
}

function cleanCep(cep: string): string {
  return cep.replace(/\D/g, '').padEnd(8, '0').slice(0, 8);
}

function buildCorreiosUrl(
  input: ShippingQuoteInput,
  serviceCodes: string[]
): string {
  const params: CorreiosApiParams = {
    nCdEmpresa: process.env.CORREIOS_EMPRESA || '',
    sDsSenha: process.env.CORREIOS_SENHA || '',
    nCdServico: serviceCodes.join(','),
    sCepOrigem: cleanCep(input.origin_cep),
    sCepDestino: cleanCep(input.destination_cep),
    nVlPeso: String(Math.max(0.1, input.weight_kg)),
    nCdFormato: '1', // 1 = caixa/pacote
    nVlComprimento: String(Math.max(16, input.length_cm)),
    nVlAltura: String(Math.max(2, input.height_cm)),
    nVlLargura: String(Math.max(11, input.width_cm)),
    nVlDiametro: '0',
    sCdMaoPropria: 'N',
    nVlValorDeclarado: String(Math.min(input.order_value, 10000)),
    sCdAvisoRecebimento: 'N',
    StrRetorno: 'json',
  };

  const qs = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  return `${CORREIOS_CALC_URL}?${qs}`;
}

/**
 * Call the Correios CalcPrecoPrazo web service.
 * Times out after 8 seconds.
 */
export async function fetchCorreiosQuotes(
  input: ShippingQuoteInput,
  serviceCodes: string[] = DEFAULT_SERVICE_CODES
): Promise<ShippingOption[]> {
  const url = buildCorreiosUrl(input, serviceCodes);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Correios HTTP ${res.status}`);

    const json = (await res.json()) as any;

    // The API returns { Servicos: { cServico: [...] } } or similar structures
    let services: any[] = [];
    if (json?.Servicos?.cServico) {
      services = Array.isArray(json.Servicos.cServico)
        ? json.Servicos.cServico
        : [json.Servicos.cServico];
    } else if (Array.isArray(json)) {
      services = json;
    }

    return services.map((svc: any) => {
      const code = String(svc.Codigo ?? svc.codigo ?? '');
      const errorMsg = svc.MsgErro ?? svc.Erro ?? '';
      const hasError = errorMsg && errorMsg !== '0' && errorMsg.trim() !== '';
      const rawPrice = String(svc.Valor ?? svc.valor ?? '0').replace(',', '.');
      const rawDays = String(svc.PrazoEntrega ?? svc.prazoEntrega ?? '0');

      return {
        service_code: code,
        service_name: CORREIOS_SERVICES[code] || `Correios ${code}`,
        price: parseFloat(rawPrice) || 0,
        deadline_days: parseInt(rawDays, 10) || 0,
        ...(hasError ? { error: String(errorMsg).trim() } : {}),
      };
    });
  } finally {
    clearTimeout(timeout);
  }
}

// --- Local fallback ----------------------------------------------------------

export type ShippingRegion =
  | 'SP_CAPITAL'
  | 'SP_INTERIOR'
  | 'SUDESTE'
  | 'SUL'
  | 'NORDESTE'
  | 'NORTE'
  | 'CENTRO_OESTE'
  | 'UNKNOWN';

export function getRegionFromCep(cep: string): ShippingRegion {
  const clean = cep.replace(/\D/g, '');
  if (!clean || clean.length < 2) return 'UNKNOWN';
  const prefix = parseInt(clean.slice(0, 2), 10);

  if (prefix >= 1 && prefix <= 9) return 'SP_CAPITAL';
  if (prefix >= 10 && prefix <= 19) return 'SP_INTERIOR';
  if (prefix >= 20 && prefix <= 28) return 'SUDESTE';
  if (prefix >= 29 && prefix <= 29) return 'SUDESTE';
  if (prefix >= 30 && prefix <= 39) return 'SUDESTE';
  if (prefix >= 40 && prefix <= 48) return 'NORDESTE';
  if (prefix >= 49 && prefix <= 49) return 'NORDESTE';
  if (prefix >= 50 && prefix <= 56) return 'NORDESTE';
  if (prefix >= 57 && prefix <= 57) return 'NORDESTE';
  if (prefix >= 58 && prefix <= 58) return 'NORDESTE';
  if (prefix >= 59 && prefix <= 59) return 'NORDESTE';
  if (prefix >= 60 && prefix <= 63) return 'NORDESTE';
  if (prefix >= 64 && prefix <= 64) return 'NORDESTE';
  if (prefix >= 65 && prefix <= 65) return 'NORDESTE';
  if (prefix >= 66 && prefix <= 68) return 'NORTE';
  if (prefix >= 69 && prefix <= 69) return 'NORTE';
  if (prefix >= 70 && prefix <= 73) return 'CENTRO_OESTE';
  if (prefix >= 74 && prefix <= 76) return 'CENTRO_OESTE';
  if (prefix >= 77 && prefix <= 77) return 'CENTRO_OESTE';
  if (prefix >= 78 && prefix <= 78) return 'CENTRO_OESTE';
  if (prefix >= 79 && prefix <= 79) return 'CENTRO_OESTE';
  if (prefix >= 80 && prefix <= 87) return 'SUL';
  if (prefix >= 88 && prefix <= 89) return 'SUL';
  if (prefix >= 90 && prefix <= 99) return 'SUL';
  return 'UNKNOWN';
}

// SEDEX-like rates per region
const SEDEX_BASE: Record<ShippingRegion, number> = {
  SP_CAPITAL: 15, SP_INTERIOR: 18, SUDESTE: 22, SUL: 25,
  NORDESTE: 35, NORTE: 42, CENTRO_OESTE: 30, UNKNOWN: 35,
};
const SEDEX_PER_KG: Record<ShippingRegion, number> = {
  SP_CAPITAL: 3, SP_INTERIOR: 3.5, SUDESTE: 4.5, SUL: 5,
  NORDESTE: 7, NORTE: 9, CENTRO_OESTE: 6, UNKNOWN: 7.5,
};
const SEDEX_DAYS: Record<ShippingRegion, number> = {
  SP_CAPITAL: 1, SP_INTERIOR: 2, SUDESTE: 3, SUL: 3,
  NORDESTE: 5, NORTE: 7, CENTRO_OESTE: 4, UNKNOWN: 6,
};

// PAC-like rates per region
const PAC_BASE: Record<ShippingRegion, number> = {
  SP_CAPITAL: 12, SP_INTERIOR: 14, SUDESTE: 17, SUL: 19,
  NORDESTE: 26, NORTE: 32, CENTRO_OESTE: 23, UNKNOWN: 28,
};
const PAC_PER_KG: Record<ShippingRegion, number> = {
  SP_CAPITAL: 2, SP_INTERIOR: 2.5, SUDESTE: 3, SUL: 3.5,
  NORDESTE: 5, NORTE: 6.5, CENTRO_OESTE: 4.5, UNKNOWN: 5.5,
};
const PAC_DAYS: Record<ShippingRegion, number> = {
  SP_CAPITAL: 3, SP_INTERIOR: 4, SUDESTE: 5, SUL: 6,
  NORDESTE: 9, NORTE: 12, CENTRO_OESTE: 7, UNKNOWN: 10,
};

function calcFallbackOption(
  region: ShippingRegion,
  weightKg: number,
  baseMap: Record<ShippingRegion, number>,
  perKgMap: Record<ShippingRegion, number>,
  daysMap: Record<ShippingRegion, number>,
  code: string,
  name: string
): ShippingOption {
  const weight = Math.max(0.1, weightKg);
  const base = baseMap[region];
  const extra = Math.max(0, weight - 1) * perKgMap[region];
  return {
    service_code: code,
    service_name: name,
    price: parseFloat((base + extra).toFixed(2)),
    deadline_days: daysMap[region],
  };
}

export function calculateFallbackQuotes(
  input: ShippingQuoteInput
): ShippingOption[] {
  const region = getRegionFromCep(input.destination_cep);
  return [
    calcFallbackOption(
      region, input.weight_kg,
      SEDEX_BASE, SEDEX_PER_KG, SEDEX_DAYS,
      '04014', 'SEDEX'
    ),
    calcFallbackOption(
      region, input.weight_kg,
      PAC_BASE, PAC_PER_KG, PAC_DAYS,
      '04510', 'PAC'
    ),
  ];
}

// --- Main entry point --------------------------------------------------------

function applyFreeShipping(
  options: ShippingOption[],
  orderValue: number
): ShippingOption[] {
  if (orderValue < FREE_SHIPPING_ABOVE) return options;
  return options.map((o) => ({ ...o, price: 0 }));
}

/**
 * Calculate shipping quotes. Tries Correios API first, falls back to local
 * calculation if the API call fails or times out.
 */
export async function calculateShipping(
  input: ShippingQuoteInput
): Promise<ShippingQuoteResult> {
  const normalised: ShippingQuoteInput = {
    ...input,
    origin_cep: input.origin_cep || DEFAULT_ORIGIN_CEP,
    destination_cep: cleanCep(input.destination_cep),
    weight_kg: Math.max(0.1, input.weight_kg),
    length_cm: Math.max(16, input.length_cm || 16),
    width_cm: Math.max(11, input.width_cm || 11),
    height_cm: Math.max(2, input.height_cm || 2),
  };

  try {
    const options = await fetchCorreiosQuotes(normalised);
    // Filter out options with errors and zero price
    const valid = options.filter((o) => !o.error && o.price > 0);

    if (valid.length > 0) {
      return {
        options: applyFreeShipping(valid, input.order_value),
        source: 'correios',
      };
    }
  } catch {
    // Correios API failed - use fallback
  }

  const fallback = calculateFallbackQuotes(normalised);
  return {
    options: applyFreeShipping(fallback, input.order_value),
    source: 'fallback',
  };
}
