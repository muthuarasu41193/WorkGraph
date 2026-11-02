import type { SalaryFigure } from "@/components/product/SalaryDisplay"

const UNDISCLOSED: SalaryFigure = { kind: "undisclosed" }

const CURRENCY =
  "(?:₹|\\$|€|£|\\bINR\\b|\\bUSD\\b|\\bEUR\\b|\\bGBP\\b|\\bRs\\.?)"
const NUMBER = "(\\d[\\d,]*(?:\\.\\d+)?)"
const SEP = "(?:-|–|—|\\bto\\b)"
const LPA_UNIT = "(?:lpa|l\\.p\\.a\\.|lakhs?\\s+per\\s+annum|lacs?\\s+per\\s+annum)"
const HOUR_UNIT = "(?:\\/\\s*h(?:ou)?r|per\\s+hour|an\\s+hour)"

type Hit = {
  start: number
  end: number
  figure: SalaryFigure
}

function currencyCode(token: string | undefined): string | null {
  if (!token) return null
  const value = token.toLowerCase().replace(/\./g, "")
  if (value === "$" || value === "usd" || value === "us$") return "USD"
  if (value === "₹" || value === "inr" || value === "rs") return "INR"
  if (value === "€" || value === "eur") return "EUR"
  if (value === "£" || value === "gbp") return "GBP"
  return null
}

function parseAmount(raw: string | undefined, kilo: string | undefined): number | null {
  if (!raw) return null
  const digits = raw.replace(/,/g, "")
  if (!/^\d+(?:\.\d+)?$/.test(digits)) return null
  const value = Number(digits)
  if (!Number.isFinite(value) || value <= 0) return null
  return kilo ? value * 1000 : value
}

function labelOf(text: string, start: number, end: number): string {
  return text.slice(start, end).replace(/\s+/g, " ").trim()
}

function rangeFigure(
  text: string,
  start: number,
  end: number,
  currency: string,
  period: string,
  min: number,
  max: number,
): SalaryFigure {
  return {
    kind: "range",
    min: Math.min(min, max),
    max: Math.max(min, max),
    currency,
    period,
    label: labelOf(text, start, end),
  }
}

function singleFigure(
  text: string,
  start: number,
  end: number,
  currency: string,
  period: string,
  amount: number,
): SalaryFigure {
  return {
    kind: "single",
    amount,
    currency,
    period,
    label: labelOf(text, start, end),
  }
}

function blockedContext(text: string, start: number, end: number): boolean {
  const before = text.slice(Math.max(0, start - 32), start)
  const after = text.slice(end, end + 28)
  if (/\b(?:team of|group of|staff of|headcount of|class of)\s*$/i.test(before)) return true
  return /^\s*(?:years?|yrs?|yoe|employees|people|persons|engineers|developers|members|openings)\b/i.test(after)
}

function push(hits: Hit[], text: string, start: number, end: number, figure: SalaryFigure) {
  if (blockedContext(text, start, end)) return
  if (figure.kind === "undisclosed") return
  hits.push({ start, end, figure })
}

function firstCurrency(fragment: string): string | null {
  const match = fragment.match(new RegExp(CURRENCY, "i"))
  return currencyCode(match?.[0])
}

function collect(text: string): Hit[] {
  const hits: Hit[] = []

  const lpaRange = new RegExp(
    `(?:${CURRENCY}\\s*)?(?<min>${NUMBER})\\s*${SEP}\\s*(?:${CURRENCY}\\s*)?(?<max>${NUMBER})\\s*${LPA_UNIT}`,
    "gi",
  )
  for (const match of text.matchAll(lpaRange)) {
    const min = parseAmount(match.groups?.min, undefined)
    const max = parseAmount(match.groups?.max, undefined)
    if (min == null || max == null) continue
    const start = match.index ?? 0
    const end = start + match[0].length
    push(hits, text, start, end, rangeFigure(text, start, end, firstCurrency(match[0]) ?? "INR", "per year", min * 100_000, max * 100_000))
  }

  const lpaSingle = new RegExp(`(?:${CURRENCY}\\s*)?(?<amount>${NUMBER})\\s*${LPA_UNIT}`, "gi")
  for (const match of text.matchAll(lpaSingle)) {
    const amount = parseAmount(match.groups?.amount, undefined)
    if (amount == null) continue
    const start = match.index ?? 0
    const end = start + match[0].length
    push(hits, text, start, end, singleFigure(text, start, end, firstCurrency(match[0]) ?? "INR", "per year", amount * 100_000))
  }

  const hourRange = new RegExp(
    `${CURRENCY}\\s*(?<min>${NUMBER})\\s*(?<minK>k)?\\s*${SEP}\\s*(?:${CURRENCY}\\s*)?(?<max>${NUMBER})\\s*(?<maxK>k)?\\s*${HOUR_UNIT}`,
    "gi",
  )
  for (const match of text.matchAll(hourRange)) {
    const min = parseAmount(match.groups?.min, match.groups?.minK)
    const max = parseAmount(match.groups?.max, match.groups?.maxK)
    const currency = firstCurrency(match[0])
    if (min == null || max == null || !currency) continue
    const start = match.index ?? 0
    const end = start + match[0].length
    push(hits, text, start, end, rangeFigure(text, start, end, currency, "per hour", min, max))
  }

  const hourSingle = new RegExp(`${CURRENCY}\\s*(?<amount>${NUMBER})\\s*(?<kilo>k)?\\s*${HOUR_UNIT}`, "gi")
  for (const match of text.matchAll(hourSingle)) {
    const amount = parseAmount(match.groups?.amount, match.groups?.kilo)
    const currency = firstCurrency(match[0])
    if (amount == null || !currency) continue
    const start = match.index ?? 0
    const end = start + match[0].length
    push(hits, text, start, end, singleFigure(text, start, end, currency, "per hour", amount))
  }

  const moneyRange = new RegExp(
    `${CURRENCY}\\s*(?<min>${NUMBER})\\s*(?<minK>k)?\\s*${SEP}\\s*(?:${CURRENCY}\\s*)?(?<max>${NUMBER})\\s*(?<maxK>k)?`,
    "gi",
  )
  for (const match of text.matchAll(moneyRange)) {
    const min = parseAmount(match.groups?.min, match.groups?.minK)
    const max = parseAmount(match.groups?.max, match.groups?.maxK)
    const currency = firstCurrency(match[0])
    if (min == null || max == null || !currency) continue
    const hasUnit = Boolean(match.groups?.minK || match.groups?.maxK)
    if (!hasUnit && min < 1000 && max < 1000) continue
    const start = match.index ?? 0
    const end = start + match[0].length
    push(hits, text, start, end, rangeFigure(text, start, end, currency, "per year", min, max))
  }

  const moneySingle = new RegExp(
    `${CURRENCY}\\s*(?<amount>${NUMBER})\\s*(?<kilo>k)?\\s*(?<unit>per\\s+(?:annum|year)|annually|p\\.a\\.|\\/\\s*year)?`,
    "gi",
  )
  for (const match of text.matchAll(moneySingle)) {
    const amount = parseAmount(match.groups?.amount, match.groups?.kilo)
    const currency = firstCurrency(match[0])
    if (amount == null || !currency) continue
    const hasUnit = Boolean(match.groups?.kilo || match.groups?.unit)
    if (!hasUnit && amount < 10_000) continue
    const start = match.index ?? 0
    const before = text.slice(Math.max(0, start - 48), start)
    const cued = /\b(?:salary|compensation|ctc|package|stipend|pay|pays)\b/i.test(before)
    if (!hasUnit && !cued) continue
    const end = start + match[0].length
    push(hits, text, start, end, singleFigure(text, start, end, currency, "per year", amount))
  }

  return hits
}

/** Read a pay figure only when the posting states a currency or a pay unit. Anything else is undisclosed. */
export function parseStatedSalary(text: string | null | undefined): SalaryFigure {
  if (typeof text !== "string" || !text.trim()) return UNDISCLOSED
  const hits = collect(text)
  if (hits.length === 0) return UNDISCLOSED
  hits.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start))
  return hits[0]?.figure ?? UNDISCLOSED
}

/**
 * Numeric key for ordering only. It is the stated maximum in the posting's own units.
 * Hourly rates are not turned into a yearly figure, and currencies are not converted.
 * Null means the posting did not state pay; those rows sort last.
 */
export function statedPaySortKey(figure: SalaryFigure): number | null {
  if (figure.kind === "range") {
    const max = figure.max ?? figure.min
    return typeof max === "number" && max > 0 ? max : null
  }
  if (figure.kind === "single") {
    return typeof figure.amount === "number" && figure.amount > 0 ? figure.amount : null
  }
  return null
}

/** Map a stated figure into the existing profile filter shape. Not an estimate. */
export function statedSalaryFilterMeta(figure: SalaryFigure): {
  minK: number
  maxK: number
  currency: string
  period: "year" | "hour"
} | null {
  if (figure.kind !== "range" && figure.kind !== "single") return null
  const period = figure.period === "per hour" ? "hour" : "year"
  const min = figure.kind === "range" ? (figure.min ?? 0) : (figure.amount ?? 0)
  const max = figure.kind === "range" ? (figure.max ?? min) : (figure.amount ?? min)
  if (!(min > 0) || !(max > 0)) return null
  const scale = period === "hour" ? 1 : 1 / 1000
  const minK = Math.round(Math.min(min, max) * scale)
  const maxK = Math.round(Math.max(min, max) * scale)
  if (minK <= 0 || maxK <= 0) return null
  return { minK, maxK, currency: figure.currency ?? "USD", period }
}
