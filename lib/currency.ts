export type SupportedCurrency = "INR" | "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "SGD" | "AED";

const INR_FX: Record<SupportedCurrency, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0094,
  CAD: 0.016,
  AUD: 0.018,
  SGD: 0.016,
  AED: 0.044,
};

const CURRENCY_LOCALE: Record<SupportedCurrency, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "en-DE",
  GBP: "en-GB",
  CAD: "en-CA",
  AUD: "en-AU",
  SGD: "en-SG",
  AED: "en-AE",
};

function asSupportedCurrency(value: string | null | undefined): SupportedCurrency | null {
  if (!value) return null;
  const code = value.toUpperCase();
  if (code in INR_FX) return code as SupportedCurrency;
  return null;
}

export function inferCurrencyFromLocation(location: string | null | undefined): SupportedCurrency {
  const text = (location ?? "").toLowerCase();
  if (!text) return "INR";

  if (/(india|mumbai|bengaluru|bangalore|hyderabad|chennai|delhi|pune|kolkata)/.test(text)) return "INR";
  if (/(united states|usa|us\b|new york|san francisco|seattle|austin)/.test(text)) return "USD";
  if (/(united kingdom|uk\b|london|manchester|birmingham)/.test(text)) return "GBP";
  if (/(germany|france|spain|italy|netherlands|europe|eu\b|berlin|paris|madrid|amsterdam)/.test(text))
    return "EUR";
  if (/(canada|toronto|vancouver|montreal)/.test(text)) return "CAD";
  if (/(australia|sydney|melbourne|brisbane)/.test(text)) return "AUD";
  if (/(singapore)/.test(text)) return "SGD";
  if (/(uae|dubai|abu dhabi|united arab emirates)/.test(text)) return "AED";
  return "INR";
}

export function resolvePreferredCurrency(params: {
  walletCurrency?: string | null;
  location?: string | null;
}): SupportedCurrency {
  return asSupportedCurrency(params.walletCurrency) ?? inferCurrencyFromLocation(params.location) ?? "INR";
}

export function convertInrToCurrency(amountInr: number, currency: SupportedCurrency): number {
  return Math.max(0, amountInr) * INR_FX[currency];
}

export function formatCurrencyAmount(amount: number, currency: SupportedCurrency, locale?: string): string {
  return new Intl.NumberFormat(locale ?? CURRENCY_LOCALE[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Math.max(0, amount));
}

