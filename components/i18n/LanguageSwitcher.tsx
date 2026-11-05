"use client"

import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { localeNames, locales, type AppLocale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("locales")
  const locale = useLocale() as AppLocale
  const pathname = usePathname()
  const router = useRouter()

  return (
    <label className={cn("inline-flex min-h-11 items-center gap-2 text-role-caption", className)}>
      <span className="sr-only">{t("switcherLabel")}</span>
      <select
        aria-label={t("switcherLabel")}
        className="min-h-11 rounded-control border border-hairline bg-surface-raised px-2 text-role-caption text-ink"
        value={locale}
        onChange={(event) => {
          const next = event.target.value as AppLocale
          router.replace(pathname, { locale: next })
        }}
      >
        {locales.map((code) => (
          <option key={code} value={code} lang={code}>
            {localeNames[code]}
          </option>
        ))}
      </select>
    </label>
  )
}
