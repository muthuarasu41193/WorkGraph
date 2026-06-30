import type { ParsedJobDescription } from "../types";
import { asString, asStringArray } from "../utils";

const SKILL_LINE_PATTERNS = [
  /(?:required|must have|requirements?)[:.]?\s*(.+)/i,
  /(?:preferred|nice to have|bonus)[:.]?\s*(.+)/i,
  /(?:qualifications?)[:.]?\s*(.+)/i,
  /(?:skills?)[:.]?\s*(.+)/i,
];

const SENIORITY_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b(intern|internship)\b/i, label: "Intern" },
  { pattern: /\b(junior|entry[- ]?level|graduate)\b/i, label: "Junior" },
  { pattern: /\b(mid[- ]?level|intermediate)\b/i, label: "Mid-level" },
  { pattern: /\b(senior|sr\.?)\b/i, label: "Senior" },
  { pattern: /\b(staff|principal|lead)\b/i, label: "Staff/Lead" },
  { pattern: /\b(director|head of|vp|vice president)\b/i, label: "Director+" },
];

function splitListItems(text: string): string[] {
  return text
    .split(/[,;•|\n]/)
    .map((s) => s.replace(/^[\s\-*•]+/, "").trim())
    .filter((s) => s.length > 1 && s.length < 80);
}

function extractSection(text: string, headers: RegExp[]): string[] {
  const lines = text.split(/\n/);
  const items: string[] = [];
  let capturing = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (capturing && items.length > 0) capturing = false;
      continue;
    }
    if (headers.some((h) => h.test(trimmed))) {
      capturing = true;
      const afterColon = trimmed.split(/[:–-]/).slice(1).join(":").trim();
      if (afterColon) items.push(...splitListItems(afterColon));
      continue;
    }
    if (capturing && /^[\-*•\d.]/.test(trimmed)) {
      items.push(trimmed.replace(/^[\-*•\d.]+\s*/, ""));
    }
  }
  return items.slice(0, 30);
}

/**
 * Deterministic JobDescriptionParser — extracts structure without LLM.
 */
export function parseJobDescription(text: string, hints?: { title?: string; company?: string }): ParsedJobDescription {
  const normalized = text.trim();
  const firstLine = normalized.split(/\n/).find((l) => l.trim()) ?? "";

  let title = hints?.title ?? null;
  let company = hints?.company ?? null;

  if (!title && firstLine.length < 120) {
    title = firstLine.trim();
  }

  const companyMatch = normalized.match(/(?:at|@)\s+([A-Z][A-Za-z0-9&.\-\s]{2,40})/);
  if (!company && companyMatch?.[1]) {
    company = companyMatch[1].trim();
  }

  let seniority: string | null = null;
  for (const { pattern, label } of SENIORITY_PATTERNS) {
    if (pattern.test(normalized) || (title && pattern.test(title))) {
      seniority = label;
      break;
    }
  }

  const requiredSkills: string[] = [];
  const preferredSkills: string[] = [];

  for (const line of normalized.split(/\n/)) {
    for (const pattern of SKILL_LINE_PATTERNS) {
      const match = line.match(pattern);
      if (!match?.[1]) continue;
      const items = splitListItems(match[1]);
      if (/preferred|nice|bonus/i.test(line)) {
        preferredSkills.push(...items);
      } else {
        requiredSkills.push(...items);
      }
    }
  }

  const responsibilities = extractSection(normalized, [
    /responsibilit/i,
    /what you.?ll do/i,
    /the role/i,
    /you will/i,
  ]);

  const qualifications = extractSection(normalized, [
    /qualification/i,
    /requirement/i,
    /what we.?re looking/i,
    /you have/i,
    /must have/i,
  ]);

  return {
    title,
    company,
    seniority,
    requiredSkills: [...new Set(requiredSkills)].slice(0, 25),
    preferredSkills: [...new Set(preferredSkills)].slice(0, 25),
    responsibilities,
    qualifications,
    rawLength: normalized.length,
  };
}

export function formatParsedJobForPrompt(parsed: ParsedJobDescription): string {
  return [
    parsed.title ? `Title: ${parsed.title}` : null,
    parsed.company ? `Company: ${parsed.company}` : null,
    parsed.seniority ? `Seniority: ${parsed.seniority}` : null,
    parsed.requiredSkills.length ? `Required skills: ${parsed.requiredSkills.join(", ")}` : null,
    parsed.preferredSkills.length ? `Preferred skills: ${parsed.preferredSkills.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
