import { EMBEDDING_MAX_TEXT_CHARS } from "./types";
import { redactPiiForEmbedding } from "./generate";

function joinParts(parts: Array<string | null | undefined>): string {
  return redactPiiForEmbedding(
    parts
      .map((part) => (typeof part === "string" ? part.trim() : ""))
      .filter(Boolean)
      .join("\n"),
  ).slice(0, EMBEDDING_MAX_TEXT_CHARS);
}

/** Career profile — skills, headline, summary. No email/phone/name. */
export function profileEmbeddingText(input: {
  headline?: string | null;
  summary?: string | null;
  skills?: string[];
  target_roles?: string[];
  seniority?: string | null;
}): string {
  return joinParts([
    input.headline,
    input.summary,
    input.seniority,
    ...(input.target_roles ?? []),
    (input.skills ?? []).join(" "),
  ]);
}

/** Resume snapshot without contact PII or raw file contents. */
export function resumeEmbeddingText(input: {
  professional_summary?: string | null;
  skills?: string[];
  target_roles?: string[];
  seniority?: string | null;
  experience?: Array<{ title?: string; company?: string }>;
}): string {
  const roles = (input.experience ?? []).flatMap((item) => [item.title, item.company]);
  return joinParts([
    input.professional_summary,
    input.seniority,
    ...(input.target_roles ?? []),
    ...(input.skills ?? []),
    ...roles,
  ]);
}

export function skillEmbeddingText(skill: string, canonical?: string, category?: string): string {
  return joinParts([skill, canonical, category]);
}

export function experienceEmbeddingText(input: {
  title?: string;
  company?: string;
  duration?: string;
  description?: string;
}): string {
  return joinParts([input.title, input.company, input.duration, input.description]);
}

export function projectEmbeddingText(input: { name?: string; description?: string }): string {
  return joinParts([input.name, input.description]);
}

export function jobDescriptionEmbeddingText(input: {
  title?: string;
  company?: string;
  location?: string;
  description?: string;
}): string {
  return joinParts([input.title, input.company, input.location, input.description]);
}

const REQUIREMENTS_HEADER = /^(requirements?|qualifications?|what you.ll need|must have|you have)\b/i;

/** Job requirements slice — public listing text only. */
export function jobRequirementsEmbeddingText(description: string, title?: string): string {
  const lines = description.split(/\n/);
  const captured: string[] = [];
  let inSection = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inSection && captured.length > 0) break;
      continue;
    }
    if (REQUIREMENTS_HEADER.test(trimmed) && trimmed.length < 80) {
      inSection = true;
      const after = trimmed.split(/[:–-]/).slice(1).join(":").trim();
      if (after) captured.push(after);
      continue;
    }
    if (inSection && /^[A-Z][A-Za-z ]{2,40}$/.test(trimmed) && !/^[-*•]/.test(trimmed)) break;
    if (inSection) captured.push(trimmed);
  }
  const body = captured.join("\n").trim();
  return joinParts([title, body || description.slice(0, 4000)]);
}
