import type { AppLocale } from "@/i18n/routing"

const localeTag: Record<AppLocale, string> = {
  en: "en-US",
  ta: "ta-IN",
  hi: "hi-IN",
  es: "es-ES",
}

export function intlLocale(locale: string): string {
  return localeTag[locale as AppLocale] ?? locale
}

export function formatNumber(value: number, locale: string, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(intlLocale(locale), options).format(value)
}

export function formatDate(
  value: Date | string | number,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat(intlLocale(locale), options).format(date)
}

export function formatCurrency(
  amount: number,
  locale: string,
  currency: string,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency,
    ...options,
  }).format(amount)
}

export function formatRelativeDay(iso: string | null | undefined, locale: string, now = Date.now()): string {
  if (!iso) return ""
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ""
  const days = Math.round((then - now) / (24 * 60 * 60 * 1000))
  return new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" }).format(days, "day")
}
