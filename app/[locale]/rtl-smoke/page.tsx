import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher"
import { Text } from "@/components/ui/text"
import { formatCurrency, formatDate, formatNumber } from "@/lib/i18n/format"

export const metadata: Metadata = {
  title: "RTL smoke test",
  robots: { index: false, follow: false },
}

/**
 * Manual smoke page: open with ? or / path under a locale and force dir=rtl in DevTools
 * (or set document.documentElement.dir). Confirms logical start/end alignment.
 */
export default async function RtlSmokePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("format")
  const sampleDate = formatDate("2026-11-05T00:00:00Z", locale)
  const sampleNumber = formatNumber(12345.6, locale)
  const sampleMoney = formatCurrency(1999, locale, locale === "es" ? "EUR" : "INR")

  return (
    <main id="main-content" tabIndex={-1} className="measure space-y-6 px-4 py-8" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <Text as="h1" role="title">
          RTL smoke
        </Text>
        <LanguageSwitcher />
      </div>
      <Text role="body-small" className="text-ink-muted">
        This page forces <code>dir=&quot;rtl&quot;</code> on the main landmark. Start-aligned controls and
        the language switcher should flip without left/right hard-coding.
      </Text>
      <div className="flex items-center justify-between gap-3 rounded-card border border-hairline bg-surface-raised p-3">
        <span className="text-role-body-small">Start edge</span>
        <span className="text-role-body-small">End edge</span>
      </div>
      <ul className="space-y-2 text-role-body-small">
        <li>
          {t("dateSample")} {sampleDate}
        </li>
        <li>
          {t("currencySample")} {sampleMoney}
        </li>
        <li>Number: {sampleNumber}</li>
      </ul>
      <p className="border-s-4 border-accent ps-3 text-role-caption text-ink-muted">
        Border on the inline-start side. If this looks like a left border under RTL, logical CSS failed.
      </p>
    </main>
  )
}
