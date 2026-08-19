const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;

export function normalizeResumeText(text: string): string {
  return text
    .replace(/\u0000/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function collapsedText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function lowerCollapsed(text: string): string {
  return collapsedText(text).toLowerCase();
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function textIncludesTerm(haystackLower: string, term: string): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle || !haystackLower) return false;
  if (needle.length <= 3) {
    return new RegExp(`\\b${escapeRegExp(needle)}\\b`, "i").test(haystackLower);
  }
  return haystackLower.includes(needle);
}

export function roundConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, Math.round(value * 100) / 100));
}

export function confident(value: string, confidence: number): { value: string; confidence: number } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return { value: trimmed, confidence: roundConfidence(confidence) };
}

/** Ground a claimed string against resume text. Exact / alias hits only — never invent. */
export function evidenceConfidence(sourceLower: string, claim: string, aliases: string[] = []): number | null {
  const variants = [claim, ...aliases].map((item) => item.trim()).filter(Boolean);
  for (const variant of variants) {
    if (textIncludesTerm(sourceLower, variant)) {
      return variant.toLowerCase() === claim.trim().toLowerCase() ? 0.97 : 0.9;
    }
  }
  return null;
}

export function redactForEmbedding(text: string): string {
  return text.replace(EMAIL_RE, " ").replace(PHONE_RE, " ").replace(/\s+/g, " ").trim();
}

export function firstNonEmptyLine(text: string): string {
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed) return trimmed;
  }
  return "";
}
