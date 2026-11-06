import { z } from "zod"
import { getGroqClient, GROQ_MODEL } from "@/lib/groq"
import { parseAssistantJsonObject } from "@/lib/parseAssistantJson"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import {
  companyNameCacheKey,
  normalizeCompanyNameRules,
  type RulesResult,
} from "@/lib/company-name/normalize-rules"

export type NormalizeCompanyNameResult = {
  displayName: string
  source: "rules" | "groq" | "cache" | "fallback"
  raw: string
}

const groqSchema = z.object({
  display_name: z.string().min(1).max(200),
})

const GROQ_SYSTEM = `You normalize employer company names for a job index.
Return JSON only matching {"display_name":"..."}.
Rules:
- Split glued legal suffixes (LLC, Inc, Ltd, GmbH, Corp) with a space.
- Restore normal commercial casing (e.g. SharkNinja Operating LLC).
- Do not invent a different company. Do not add slogans or locations.
- If the input is already fine, return it lightly cleaned.`

async function readCache(rawKey: string): Promise<string | null> {
  const admin = createSupabaseAdminClient()
  if (!admin) return null
  const { data, error } = await admin
    .from("company_name_cache")
    .select("display_name")
    .eq("raw_key", rawKey)
    .maybeSingle()
  if (error || !data?.display_name) return null
  return String(data.display_name)
}

async function writeCache(input: {
  rawKey: string
  rawName: string
  displayName: string
  source: "rules" | "groq" | "manual"
  model?: string | null
}): Promise<void> {
  const admin = createSupabaseAdminClient()
  if (!admin) return
  await admin.from("company_name_cache").upsert(
    {
      raw_key: input.rawKey,
      raw_name: input.rawName,
      display_name: input.displayName,
      source: input.source,
      model: input.model ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "raw_key" },
  )
}

async function groqNormalize(raw: string, rulesHint: string): Promise<string | null> {
  if (!process.env.GROQ_API_KEY?.trim()) return null
  try {
    const groq = getGroqClient()
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: GROQ_SYSTEM },
        {
          role: "user",
          content: JSON.stringify({
            raw_name: raw,
            rules_hint: rulesHint,
            schema: { display_name: "string" },
          }),
        },
      ],
    })
    const content = response.choices[0]?.message?.content ?? "{}"
    const parsed = groqSchema.safeParse(parseAssistantJsonObject(content))
    if (!parsed.success) return null
    return parsed.data.display_name.trim()
  } catch {
    return null
  }
}

/**
 * Normalize a company name once per raw string (Supabase cache).
 * Rules first; Groq only when rules are not confident; fallback to the raw string.
 */
export async function normalizeCompanyName(rawInput: string): Promise<NormalizeCompanyNameResult> {
  const raw = String(rawInput ?? "").trim()
  if (!raw) {
    return { displayName: "", source: "fallback", raw: "" }
  }

  const rawKey = companyNameCacheKey(raw)
  const cached = await readCache(rawKey)
  if (cached) {
    return { displayName: cached, source: "cache", raw }
  }

  const rules: RulesResult = normalizeCompanyNameRules(raw)
  if (rules.confident && rules.displayName) {
    await writeCache({
      rawKey,
      rawName: raw,
      displayName: rules.displayName,
      source: "rules",
    })
    return { displayName: rules.displayName, source: "rules", raw }
  }

  const fromGroq = await groqNormalize(raw, rules.displayName || raw)
  if (fromGroq) {
    await writeCache({
      rawKey,
      rawName: raw,
      displayName: fromGroq,
      source: "groq",
      model: GROQ_MODEL,
    })
    return { displayName: fromGroq, source: "groq", raw }
  }

  const fallback = rules.displayName || raw
  await writeCache({
    rawKey,
    rawName: raw,
    displayName: fallback,
    source: "rules",
  })
  return { displayName: fallback, source: "fallback", raw }
}

/** Sync helper for callers that only need the rules path (tests, offline). */
export { normalizeCompanyNameRules, companyNameCacheKey }
