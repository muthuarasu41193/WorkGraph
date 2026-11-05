import { defineRouting } from "next-intl/routing"

export const locales = ["en", "ta", "hi", "es"] as const
export type AppLocale = (typeof locales)[number]

export const localeNames: Record<AppLocale, string> = {
  en: "English",
  ta: "தமிழ்",
  hi: "हिन्दी",
  es: "Español",
}

/** Locales that should default to RTL in the smoke test / dir attribute. */
export const rtlLocales: readonly AppLocale[] = []

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale: "en",
  localePrefix: "as-needed",
})
