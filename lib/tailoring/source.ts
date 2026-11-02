/**
 * Split the session user's resume into numbered source lines for evidence-based tailoring.
 * Caps match Talent Intelligence report input (resume 12_000 chars).
 */
import { normalizeResumeText } from "@/lib/resume-intelligence/text";

/** Same resume cap as Talent Intelligence report generation. */
export const TAILORING_RESUME_CHAR_CAP = 12_000;

/** Same JD cap as Talent Intelligence report generation. */
export const TAILORING_JOB_CHAR_CAP = 8_000;

export type SourceLine = {
  id: string;
  text: string;
  index: number;
};

export type SourceDocument = {
  lines: SourceLine[];
  /** Truncated, normalised resume text used to build lines. */
  text: string;
  truncated: boolean;
};

/**
 * Normalise whitespace, cap length, then split non-empty lines into L1, L2, ...
 */
export function buildSourceLines(resumeRawText: string, maxChars = TAILORING_RESUME_CHAR_CAP): SourceDocument {
  const normalised = normalizeResumeText(resumeRawText ?? "");
  const truncated = normalised.length > maxChars;
  const text = truncated ? normalised.slice(0, maxChars) : normalised;

  const lines: SourceLine[] = [];
  for (const raw of text.split("\n")) {
    const trimmed = raw.replace(/\s+/g, " ").trim();
    if (!trimmed) continue;
    const index = lines.length + 1;
    lines.push({ id: `L${index}`, text: trimmed, index });
  }

  return { lines, text, truncated };
}

export function sourceLineMap(doc: SourceDocument): Map<string, SourceLine> {
  return new Map(doc.lines.map((line) => [line.id, line]));
}

export function formatSourceLinesForPrompt(doc: SourceDocument): string {
  if (doc.lines.length === 0) return "(empty resume)";
  return doc.lines.map((line) => `${line.id}: ${line.text}`).join("\n");
}

export function truncateJobText(jobDescription: string, maxChars = TAILORING_JOB_CHAR_CAP): string {
  const text = (jobDescription ?? "").replace(/\u0000/g, " ").trim();
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars);
}
