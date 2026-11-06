/**
 * Deterministic company-name cleanup used before (and instead of) Groq.
 * Splits stuck legal suffixes, restores casing, and flags names that still need an LLM.
 */

export const LEGAL_SUFFIXES = [
  "gmbh & co kg",
  "gmbh & co. kg",
  "pty ltd",
  "pte ltd",
  "co ltd",
  "co. ltd",
  "limited",
  "corporation",
  "incorporated",
  "company",
  "gmbh",
  "corp",
  "llc",
  "llp",
  "plc",
  "inc",
  "ltd",
  "lp",
  "ag",
  "sa",
  "ab",
  "nv",
  "bv",
  "se",
  "oy",
  "as",
  "aps",
  "sas",
  "sarl",
  "spa",
  "srl",
  "pbc",
  "pc",
] as const

/** Common glued tokens seen in ATS slugs / board names in our index. */
const COMPOUND_TOKENS = [
  "technologies",
  "technology",
  "engineering",
  "solutions",
  "systems",
  "software",
  "digital",
  "security",
  "advisory",
  "capital",
  "holdings",
  "holding",
  "group",
  "global",
  "health",
  "healthcare",
  "hospitality",
  "operating",
  "operations",
  "management",
  "partners",
  "ventures",
  "network",
  "networks",
  "media",
  "studio",
  "studios",
  "labs",
  "lab",
  "linkedin",
  "evidensia",
] as const

const PROTECTED_BRANDS = new Set(
  [
    "openai",
    "gitlab",
    "github",
    "youtube",
    "linkedin",
    "whatsapp",
    "dataclue",
    "digicert",
    "airbnb",
    "paypal",
  ].map((value) => value.toLowerCase()),
)

export type RulesResult = {
  displayName: string
  confident: boolean
  reason: "clean" | "suffix_split" | "camel_split" | "compound_split" | "title_case" | "needs_llm"
}

export function companyNameCacheKey(raw: string): string {
  return raw.trim().toLowerCase()
}

function collapseSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

function formatSuffixToken(suffix: string): string {
  const lower = suffix.toLowerCase()
  if (lower === "gmbh") return "GmbH"
  if (["llc", "llp", "plc", "inc", "ltd", "lp", "pbc", "corp", "ag", "sa", "ab", "nv", "bv", "se"].includes(lower)) {
    return lower.toUpperCase()
  }
  if (lower === "pty ltd" || lower === "pte ltd" || lower === "co ltd" || lower === "co. ltd") {
    return lower
      .split(" ")
      .map((part) => (part.endsWith(".") ? `${part.slice(0, -1).toUpperCase()}.` : part.toUpperCase()))
      .join(" ")
  }
  return lower
    .split(" ")
    .map((part) => {
      if (part === "&") return "&"
      if (part === "gmbh") return "GmbH"
      if (part === "co" || part === "co.") return "Co"
      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join(" ")
}

/** Peel a legal suffix glued to the end of a compact name (e.g. Sharkninjaoperatingllc). */
export function peelLegalSuffix(raw: string): { body: string; suffix: string | null } {
  const compact = raw.replace(/[\s.,]+/g, "")
  const lower = compact.toLowerCase()
  const ordered = [...LEGAL_SUFFIXES].sort((a, b) => b.length - a.length)
  for (const suffix of ordered) {
    const needle = suffix.replace(/[\s.]+/g, "")
    // Two-letter suffixes (SE, AG, …) are too ambiguous on glued lowercase slugs.
    if (needle.length <= 2 && !/[A-Z]/.test(raw.replace(/[\s.,]+/g, "").slice(-needle.length))) {
      continue
    }
    if (lower.length <= needle.length + 2) continue
    if (lower.endsWith(needle)) {
      return {
        body: compact.slice(0, compact.length - needle.length),
        suffix: formatSuffixToken(suffix),
      }
    }
  }
  return { body: raw.trim(), suffix: null }
}

function splitCamelCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
}

function titleCaseWord(word: string): string {
  if (!word) return word
  if (word === "GmbH") return word
  if (/^GmbH$/i.test(word)) return "GmbH"
  if (/^[A-Z0-9]{2,4}$/.test(word) && word === word.toUpperCase()) return word
  const lower = word.toLowerCase()
  if (["ai", "io", "hq", "uk", "us", "eu", "ivc"].includes(lower)) return lower.toUpperCase()
  if (["llc", "llp", "plc", "inc", "ltd", "lp", "pbc"].includes(lower)) {
    return lower.toUpperCase()
  }
  if (lower === "corp") return "Corp"
  if (["ag", "sa", "ab", "nv", "bv", "se"].includes(lower)) return lower.toUpperCase()
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

function insertCompoundSpaces(value: string): string {
  let result = value
  const tokens = [...COMPOUND_TOKENS].sort((a, b) => b.length - a.length)
  for (const token of tokens) {
    const re = new RegExp(`([a-z0-9])(${token})`, "gi")
    result = result.replace(re, (_, before: string, match: string) => `${before} ${match}`)
  }
  return collapseSpaces(result)
}

function protectGmbH(value: string): string {
  return value.replace(/\bGmb\s+H\b/gi, "GmbH").replace(/\bgmbh\b/gi, "GmbH")
}

function looksSpacedDisplay(raw: string): boolean {
  return /\s/.test(raw.trim())
}

const SUFFIX_DISPLAY = new Set(
  ["llc", "llp", "plc", "inc", "ltd", "lp", "pbc", "corp", "gmbh", "ag", "sa", "ab", "nv", "bv", "se"],
)

function needsLlmAfterRules(displayName: string, raw: string): boolean {
  const words = displayName.split(/\s+/).filter(Boolean)
  if (!displayName.trim()) return true

  const bodyWords = words.filter((word) => !SUFFIX_DISPLAY.has(word.toLowerCase()))
  // Glued letter slug: no spaces, no CamelCase, letters-only compact form (ATS board tokens).
  const compactLetters = raw.replace(/[^a-zA-Z]/g, "")
  const wasGluedSlug =
    !/\s/.test(raw.trim()) &&
    !/[a-z][A-Z]/.test(raw) &&
    !/[0-9]/.test(raw) &&
    !/\./.test(raw) &&
    compactLetters.length >= 8

  // Multi-word rule output is usually enough, except glued slugs whose first body
  // token is still an opaque dump (Sharkninja Operating LLC).
  if (bodyWords.length >= 2) {
    return wasGluedSlug && bodyWords[0].length >= 10
  }
  if (bodyWords.length === 1 && wasGluedSlug && bodyWords[0].length >= 10) return true
  return false
}

/**
 * Rule-based normalizer. Does not call the network.
 */
export function normalizeCompanyNameRules(rawInput: string): RulesResult {
  const raw = collapseSpaces(String(rawInput ?? ""))
  if (!raw) {
    return { displayName: "", confident: false, reason: "needs_llm" }
  }

  // Already spaced commercial names: preserve brand camelCase, fix GmbH, lightly title-case.
  if (looksSpacedDisplay(raw)) {
    const allCapsPhrase = raw === raw.toUpperCase()
    const preserved = protectGmbH(
      raw
        .split(/\s+/)
        .map((word) => {
          if (/^GmbH$/i.test(word)) return "GmbH"
          if (!allCapsPhrase && (/[a-z][A-Z]/.test(word) || (/[A-Z].*[A-Z]/.test(word) && /[a-z]/.test(word)))) {
            return word
          }
          if (word === word.toUpperCase() && word.length <= 3 && !allCapsPhrase) return word
          if (word === word.toUpperCase()) return titleCaseWord(word.toLowerCase())
          return titleCaseWord(word)
        })
        .join(" "),
    )
    return { displayName: preserved, confident: true, reason: "clean" }
  }

  const lowerRaw = raw.toLowerCase()
  if (PROTECTED_BRANDS.has(lowerRaw)) {
    const canonical: Record<string, string> = {
      openai: "OpenAI",
      gitlab: "GitLab",
      github: "GitHub",
      youtube: "YouTube",
      linkedin: "LinkedIn",
      whatsapp: "WhatsApp",
      dataclue: "DataClue",
      digicert: "DigiCert",
      airbnb: "Airbnb",
      paypal: "PayPal",
    }
    return { displayName: canonical[lowerRaw] ?? raw, confident: true, reason: "clean" }
  }

  let working = raw
  let reason: RulesResult["reason"] = "title_case"
  let peeledSuffix: string | null = null

  // Preserve short CamelCase brands (HighLevel, WorkWave) without forcing spaces.
  if (/[a-z]/.test(working) && /[A-Z]/.test(working) && working.length <= 9) {
    return { displayName: working, confident: true, reason: "clean" }
  }

  const peeled = peelLegalSuffix(working)
  if (peeled.suffix) {
    working = peeled.body
    peeledSuffix = peeled.suffix
    reason = "suffix_split"
  }

  // CamelCase split for longer multi-hump tokens (CesiumAstro, StackAdapt).
  const camelHumps = working.match(/[a-z][A-Z]|[A-Z]{2,}[a-z]/g)?.length ?? 0
  if (camelHumps >= 1 && working.length >= 10) {
    working = splitCamelCase(working)
    reason = reason === "suffix_split" ? "suffix_split" : "camel_split"
  }

  if (!/\s/.test(working) && working.length >= 8) {
    const compounded = insertCompoundSpaces(working)
    if (compounded !== working) {
      working = compounded
      reason = "compound_split"
    }
  }

  if (working === working.toUpperCase() && working.length > 3) {
    working = working.toLowerCase()
  }

  working = protectGmbH(collapseSpaces(working))
  const words = working.split(/\s+/).filter(Boolean).map(titleCaseWord)
  let displayName = protectGmbH(words.join(" "))
  if (peeledSuffix) {
    displayName = collapseSpaces(`${displayName} ${peeledSuffix}`)
  }

  // Special-case IVC Evidensia from index slug.
  if (/^ivc\s+evidensia$/i.test(displayName)) {
    displayName = "IVC Evidensia"
  }

  if (needsLlmAfterRules(displayName, raw)) {
    return { displayName: displayName || raw, confident: false, reason: "needs_llm" }
  }

  return { displayName, confident: true, reason }
}
