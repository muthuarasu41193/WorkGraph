/**
 * Client-safe seeker pricing display helpers.
 * Charge currency stays INR (Razorpay). Visitor currency is display-only when provided.
 */

import {
  convertInrToCurrency,
  formatCurrencyAmount,
  type SupportedCurrency,
} from "@/lib/currency";
import type { PassPlanId } from "@/lib/billing/plans";

export type SeekerBillingPeriod = "monthly" | "annual";

/** Maps the monthly/annual toggle to the Pass lengths we actually sell today. */
export function passPlanIdForPeriod(period: SeekerBillingPeriod): PassPlanId {
  return period === "annual" ? "pass_90" : "pass_30";
}

export function formatPaise(
  paise: number,
  locale: string,
  currency: "INR" = "INR",
): string {
  const amount = Math.max(0, paise) / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

export function approximateInVisitorCurrency(
  paiseInr: number,
  visitorCurrency: SupportedCurrency | null | undefined,
  locale: string,
): string | null {
  if (!visitorCurrency || visitorCurrency === "INR") return null;
  const rupees = Math.max(0, paiseInr) / 100;
  const converted = convertInrToCurrency(rupees, visitorCurrency);
  return formatCurrencyAmount(converted, visitorCurrency, locale);
}

/** Savings of the 90-day Pass vs buying three 30-day Passes, in paise. */
export function pass90SavingsPaise(pass30Paise: number, pass90Paise: number): number {
  return Math.max(0, pass30Paise * 3 - pass90Paise);
}

export function resolvePricingLocale(acceptLanguage: string | null | undefined): string {
  if (!acceptLanguage) return "en-IN";
  const first = acceptLanguage.split(",")[0]?.trim().split(";")[0]?.trim();
  return first && first.length >= 2 ? first : "en-IN";
}

/**
 * Infer a display currency from Accept-Language when Razorpay still charges INR.
 * Unsupported regions stay on INR so the charge currency matches checkout.
 */
export function resolveDisplayCurrency(
  acceptLanguage: string | null | undefined,
): SupportedCurrency {
  const locale = resolvePricingLocale(acceptLanguage).toLowerCase();
  if (locale.startsWith("en-us") || locale === "en") return "USD";
  if (locale.startsWith("en-gb")) return "GBP";
  if (locale.startsWith("en-ca") || locale.startsWith("fr-ca")) return "CAD";
  if (locale.startsWith("en-au")) return "AUD";
  if (locale.startsWith("en-sg") || locale.startsWith("zh-sg")) return "SGD";
  if (locale.startsWith("ar-ae") || locale.startsWith("en-ae")) return "AED";
  if (
    locale.startsWith("de") ||
    locale.startsWith("fr") ||
    locale.startsWith("es") ||
    locale.startsWith("it") ||
    locale.startsWith("nl") ||
    locale.startsWith("pt")
  ) {
    return "EUR";
  }
  if (locale.startsWith("hi") || locale.startsWith("en-in") || locale.startsWith("ta")) return "INR";
  return "INR";
}
