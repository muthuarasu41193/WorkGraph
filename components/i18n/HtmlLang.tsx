"use client"

import { useEffect } from "react"
import { useLocale } from "next-intl"
import { rtlLocales, type AppLocale } from "@/i18n/routing"

/** Keeps <html lang> and dir in sync after client navigations. */
export function HtmlLang() {
  const locale = useLocale() as AppLocale
  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = rtlLocales.includes(locale) ? "rtl" : "ltr"
  }, [locale])
  return null
}
