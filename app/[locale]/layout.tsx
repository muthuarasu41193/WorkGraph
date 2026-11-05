import { NextIntlClientProvider, hasLocale } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { HtmlLang } from "@/components/i18n/HtmlLang"
import { routing, type AppLocale } from "@/i18n/routing"
import { getSiteUrl } from "@/lib/site-url"

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale
  const site = getSiteUrl()
  const languages: Record<string, string> = {}
  for (const code of routing.locales) {
    languages[code] = code === routing.defaultLocale ? site : `${site}/${code}`
  }
  languages["x-default"] = site

  return {
    alternates: {
      languages,
    },
    other: {
      "content-language": locale,
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: raw } = await params
  if (!hasLocale(routing.locales, raw)) notFound()
  const locale = raw as AppLocale
  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <HtmlLang />
      {children}
    </NextIntlClientProvider>
  )
}
