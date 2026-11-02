/**
 * Treat model output as untrusted. Keep only suggestions that stay within the cited source line.
 */
import { z } from "zod";

import type { SourceLine } from "./source";

export const MAX_SUGGESTIONS = 6;
export const MAX_GAPS = 16;
export const MAX_REWRITE_CHARS = 600;
export const MAX_REQUIREMENT_CHARS = 200;
export const MAX_TIP_CHARS = 240;
export const MAX_SOURCE_ID_CHARS = 12;

/** Reject rewrites longer than ~2× the source line (character length). */
export const MAX_REWRITE_LENGTH_RATIO = 2.15;

const NUMBER_TOKEN_RE = /(?:[$€£₹]\s*)?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?%?/g;

/** Common sentence-start words that look capitalised but are not tools/skills. */
const COMMON_CAPITALS = new Set([
  "i",
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "for",
  "with",
  "by",
  "at",
  "from",
  "as",
  "my",
  "our",
  "we",
  "you",
  "your",
  "this",
  "that",
  "these",
  "those",
  "built",
  "led",
  "managed",
  "designed",
  "developed",
  "improved",
  "increased",
  "reduced",
  "created",
  "delivered",
  "owned",
  "worked",
  "using",
  "across",
  "within",
  "including",
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
]);

const rawSuggestionSchema = z
  .object({
    sourceId: z.string().trim().min(1).max(MAX_SOURCE_ID_CHARS),
    rewrite: z.string().trim().min(1).max(MAX_REWRITE_CHARS),
    jobRequirement: z.string().trim().min(1).max(MAX_REQUIREMENT_CHARS),
  })
  .strict();

const rawGapSchema = z
  .object({
    requirement: z.string().trim().min(1).max(MAX_REQUIREMENT_CHARS),
    tip: z.string().trim().min(1).max(MAX_TIP_CHARS),
  })
  .strict();

export const rawTailoringResponseSchema = z
  .object({
    suggestions: z.array(rawSuggestionSchema).max(MAX_SUGGESTIONS).default([]),
    gaps: z.array(rawGapSchema).max(MAX_GAPS).default([]),
  })
  .strict();

export type RawTailoringSuggestion = z.infer<typeof rawSuggestionSchema>;
export type RawTailoringGap = z.infer<typeof rawGapSchema>;
export type RawTailoringResponse = z.infer<typeof rawTailoringResponseSchema>;

export type VerifiedSuggestion = RawTailoringSuggestion & {
  sourceText: string;
};

export type VerifiedTailoringResult = {
  suggestions: VerifiedSuggestion[];
  gaps: RawTailoringGap[];
  rejectedCount: number;
};

export type VerifyContext = {
  sourceById: Map<string, SourceLine>;
  /** Lowercased profile skill names allowed even if not on the cited line. */
  profileSkills?: string[];
};

export function numericCore(token: string): string | null {
  const cleaned = token.replace(/[$€£₹\s]/g, "").replace(/%$/, "").replace(/,/g, "");
  if (!/^\d+(?:\.\d+)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return String(value);
}

export function extractNumberCores(text: string): Set<string> {
  const cores = new Set<string>();
  for (const token of text.match(NUMBER_TOKEN_RE) ?? []) {
    const core = numericCore(token);
    if (core) cores.add(core);
  }
  return cores;
}

/**
 * Capitalised tokens / multi-word proper nouns that look like tools, skills, or names.
 * Sentence-start common words are ignored.
 */
export function extractCapitalisedTokens(text: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  const pattern = /\b[A-Z][A-Za-z0-9+.#/-]*(?:\s+[A-Z][A-Za-z0-9+.#/-]*)*\b/g;
  for (const match of text.matchAll(pattern)) {
    const raw = match[0].trim();
    if (!raw) continue;
    const words = raw.split(/\s+/);
    const first = words[0]?.toLowerCase() ?? "";
    if (words.length === 1 && COMMON_CAPITALS.has(first)) continue;
    // Allow pure acronyms that are also in COMMON? keep them — they must be on the source line.
    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    found.push(raw);
  }
  return found;
}

function includesInsensitive(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function skillAllowed(token: string, profileSkillsLower: Set<string>): boolean {
  const lower = token.toLowerCase();
  if (profileSkillsLower.has(lower)) return true;
  for (const skill of profileSkillsLower) {
    if (skill.length >= 2 && (lower.includes(skill) || skill.includes(lower))) return true;
  }
  return false;
}

export type SuggestionRejectReason =
  | "invalid_schema"
  | "unknown_source"
  | "invented_number"
  | "invented_token"
  | "too_long";

export function reasonSuggestionFails(
  suggestion: RawTailoringSuggestion,
  ctx: VerifyContext,
): SuggestionRejectReason | null {
  const source = ctx.sourceById.get(suggestion.sourceId);
  if (!source) return "unknown_source";

  const sourceNumbers = extractNumberCores(source.text);
  for (const token of suggestion.rewrite.match(NUMBER_TOKEN_RE) ?? []) {
    const core = numericCore(token);
    if (core && !sourceNumbers.has(core)) return "invented_number";
  }

  const profileSkillsLower = new Set(
    (ctx.profileSkills ?? []).map((s) => s.trim().toLowerCase()).filter(Boolean),
  );

  for (const token of extractCapitalisedTokens(suggestion.rewrite)) {
    if (includesInsensitive(source.text, token)) continue;
    if (skillAllowed(token, profileSkillsLower)) continue;
    return "invented_token";
  }

  const maxLen = Math.max(24, Math.ceil(source.text.length * MAX_REWRITE_LENGTH_RATIO));
  if (suggestion.rewrite.length > maxLen) return "too_long";

  return null;
}

/**
 * Parse model JSON with Zod (strict). Unknown keys cause failure.
 * Caps lengths via schema.
 */
export function parseTailoringModelJson(data: unknown): RawTailoringResponse {
  return rawTailoringResponseSchema.parse(data);
}

export function tryParseTailoringModelJson(
  data: unknown,
): { ok: true; value: RawTailoringResponse } | { ok: false; error: z.ZodError } {
  const result = rawTailoringResponseSchema.safeParse(data);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, error: result.error };
}

/**
 * Keep only verified suggestions. Gaps are length-capped via schema; tips normalised.
 */
export function verifyTailoringResponse(
  raw: RawTailoringResponse,
  ctx: VerifyContext,
): VerifiedTailoringResult {
  const suggestions: VerifiedSuggestion[] = [];
  let rejectedCount = 0;

  for (const item of raw.suggestions.slice(0, MAX_SUGGESTIONS)) {
    const reason = reasonSuggestionFails(item, ctx);
    if (reason) {
      rejectedCount += 1;
      continue;
    }
    const source = ctx.sourceById.get(item.sourceId)!;
    suggestions.push({
      sourceId: item.sourceId,
      rewrite: item.rewrite,
      jobRequirement: item.jobRequirement,
      sourceText: source.text,
    });
  }

  const gaps = raw.gaps.slice(0, MAX_GAPS).map((gap) => {
    let tip = gap.tip.trim();
    if (!/^add only if true:/i.test(tip)) {
      tip = `Add only if true: ${tip.replace(/^add only if true:\s*/i, "")}`;
    }
    if (tip.length > MAX_TIP_CHARS) tip = tip.slice(0, MAX_TIP_CHARS);
    return {
      requirement: gap.requirement.slice(0, MAX_REQUIREMENT_CHARS),
      tip,
    };
  });

  return { suggestions, gaps, rejectedCount };
}
