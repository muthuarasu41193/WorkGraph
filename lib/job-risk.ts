import { isJobStale, STALE_AFTER_DAYS } from "@/lib/job-staleness"

export const RISK_CODES = [
  "payment_requested",
  "offplatform_only",
  "stale",
  "evergreen_language",
  "missing_company",
  "missing_apply_url",
] as const

export type RiskCode = (typeof RISK_CODES)[number]

export type RiskFlag = {
  code: RiskCode
  label: string
  explanation: string
}

export type JobRiskInput = {
  title?: string | null
  company?: string | null
  description?: string | null
  applyUrl?: string | null
  postedAtIso?: string | null
  isCommunity?: boolean | null
  source?: string | null
  now?: number
}

export const MAX_VISIBLE_RISK_FLAGS = 2

const COPY: Record<RiskCode, { label: string; explanation: string }> = {
  payment_requested: {
    label: "Asks for payment",
    explanation:
      "The posting asks for a fee, a deposit, registration charges, or payment to apply. This is a text match, not a check with the employer.",
  },
  offplatform_only: {
    label: "Off-platform contact only",
    explanation:
      "The only contact found is WhatsApp, Telegram, or a personal mailbox such as Gmail. No company apply link is stored. This shows up most often on community posts.",
  },
  stale: {
    label: "May be closed",
    explanation: `Posted more than ${STALE_AFTER_DAYS} days ago. The posted date is not a check that the role is still open.`,
  },
  evergreen_language: {
    label: "Always-open wording",
    explanation:
      "The posting says talent pool, future openings, or always hiring. That wording is not a dated opening.",
  },
  missing_company: {
    label: "Company name missing",
    explanation: "The company name is missing on this listing.",
  },
  missing_apply_url: {
    label: "No apply link",
    explanation: "No apply link is stored for this listing.",
  },
}

const PAYMENT_REQUEST = [
  /\bregistration\s+charges?\b/i,
  /\bpay\s+to\s+apply\b/i,
  /\bapplication\s+fee\b/i,
  /\bprocessing\s+fee\b/i,
  /\bsecurity\s+deposit\b/i,
  /\bdeposit\s+(?:required|of|to)\b/i,
  /\b(?:training|joining|registration)\s+fee\b/i,
  /\bupfront\s+(?:fee|payment|deposit)\b/i,
  /\bfee\s+(?:to|for)\s+(?:apply|applying|registration|register)\b/i,
  /\bpay(?:ment)?\s+(?:a|an|the)\s+(?:fee|deposit)\b/i,
  /\b(?:must|required\s+to)\s+pay\b/i,
]

const SOURCE_HOST =
  /(^|\.)(reddit\.com|redd\.it|news\.ycombinator\.com|github\.com|x\.com|twitter\.com|facebook\.com|t\.me|telegram\.me|telegram\.org|wa\.me|whatsapp\.com)$/i

const PERSONAL_HOST = /^(?:gmail|googlemail|yahoo|hotmail|outlook|live)(?:\.[a-z]{2,})+$/i

function asText(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function sentences(text: string): string[] {
  const parts = text.split(/[\n.!?]+/).map((part) => part.trim()).filter(Boolean)
  return parts.length > 0 ? parts : [text]
}

function sentenceNegatesPayment(sentence: string): boolean {
  return (
    /\bno\s+fees?\s+charged\b/i.test(sentence) ||
    /\b(?:no|zero|without)\b(?:\s+\w+){0,5}\s+(?:fee|fees|deposit|charges|payment)\b/i.test(sentence) ||
    /\b(?:fee|fees|deposit|charges|payment)\b(?:\s+\w+){0,4}\s+(?:not|never|waived)\b/i.test(sentence) ||
    /\b(?:do not|don't|does not|doesn't|never)\b(?:\s+\w+){0,6}\s+(?:charge|ask|require|request|collect|pay)\b/i.test(sentence) ||
    /\bwaived\b/i.test(sentence) ||
    /\bfree\s+to\s+apply\b/i.test(sentence)
  )
}

export function asksForPayment(text: string): boolean {
  for (const sentence of sentences(text)) {
    if (!PAYMENT_REQUEST.some((pattern) => pattern.test(sentence))) continue
    if (sentenceNegatesPayment(sentence)) continue
    return true
  }
  return false
}

function isCompanyApplyUrl(raw: string): boolean {
  const value = raw.trim()
  if (!/^https?:\/\//i.test(value)) return false
  try {
    const host = new URL(value).hostname.replace(/^www\./, "")
    return !SOURCE_HOST.test(host)
  } catch {
    return false
  }
}

function emails(text: string): string[] {
  return text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? []
}

function isPersonalEmail(email: string): boolean {
  const host = email.split("@")[1]?.toLowerCase() ?? ""
  return PERSONAL_HOST.test(host)
}

function hasOffplatformChannel(text: string): boolean {
  if (/\bwhatsapp\b|wa\.me\/|api\.whatsapp\.com/i.test(text)) return true
  if (/\btelegram\b|t\.me\//i.test(text)) return true
  if (/\bgmail\b/i.test(text)) return true
  return emails(text).some(isPersonalEmail)
}

function hasWorkEmail(text: string): boolean {
  return emails(text).some((email) => !isPersonalEmail(email))
}

function hasCompanyUrl(text: string): boolean {
  const urls = text.match(/https?:\/\/[^\s)]+/gi) ?? []
  return urls.some(isCompanyApplyUrl)
}

/**
 * True when WhatsApp, Telegram, or a personal mailbox is the only contact.
 * A company apply link or a work email means this flag stays off.
 */
export function isOffplatformOnly(input: JobRiskInput): boolean {
  const description = asText(input.description)
  const applyUrl = asText(input.applyUrl)
  const blob = `${asText(input.title)}\n${description}\n${applyUrl}`
  if (!hasOffplatformChannel(blob)) return false
  if (isCompanyApplyUrl(applyUrl)) return false
  if (hasCompanyUrl(description)) return false
  if (hasWorkEmail(blob)) return false
  // A company apply link already returned above. Community posts are the usual place this is the only contact.
  return true
}

function companyMissing(company: string): boolean {
  const value = company.trim()
  return value.length === 0 || value === "Company"
}

export function riskFlags(job: JobRiskInput): RiskFlag[] {
  const description = asText(job.description)
  const title = asText(job.title)
  const text = `${title}\n${description}`
  const flags: RiskFlag[] = []

  if (asksForPayment(text)) flags.push({ code: "payment_requested", ...COPY.payment_requested })
  if (isOffplatformOnly(job)) flags.push({ code: "offplatform_only", ...COPY.offplatform_only })
  if (isJobStale(typeof job.postedAtIso === "string" ? job.postedAtIso : null, job.now)) {
    flags.push({ code: "stale", ...COPY.stale })
  }
  if (/\btalent pool\b/i.test(text) || /\bfuture openings?\b/i.test(text) || /\balways hiring\b/i.test(text)) {
    flags.push({ code: "evergreen_language", ...COPY.evergreen_language })
  }
  if (companyMissing(asText(job.company))) flags.push({ code: "missing_company", ...COPY.missing_company })
  if (!asText(job.applyUrl).trim()) flags.push({ code: "missing_apply_url", ...COPY.missing_apply_url })

  return flags
}

export function visibleRiskFlags(flags: RiskFlag[]): RiskFlag[] {
  return flags.slice(0, MAX_VISIBLE_RISK_FLAGS)
}
