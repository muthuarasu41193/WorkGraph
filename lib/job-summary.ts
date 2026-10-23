/**
 * Job card copy. Source descriptions are untrusted listing text.
 * A generated summary is used only when a caller already has one.
 * There is no model call here — render time must not hit a paid API.
 */

const SUMMARY_MAX = 160;

const FIELD_LABEL =
  "tags|types|type|categories|category|departments|department|locations|location|seniority|experience";

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Drop "Tags:", "Types:", "About {Company}", and the same shape of field-label noise. */
export function sanitizeJobDescription(raw: string, company?: string | null): string {
  let text = normalize(raw);
  if (!text) return "";

  const fieldPrefix = new RegExp(
    String.raw`^(?:${FIELD_LABEL})\s*:\s*(?:(?!\s+(?:${FIELD_LABEL})\s*:|\s+about\s+).)*`,
    "i",
  );
  while (fieldPrefix.test(text)) {
    text = normalize(text.replace(fieldPrefix, ""));
  }

  const companyName = company?.trim();
  if (companyName) {
    text = normalize(text.replace(new RegExp(`^about\\s+${escapeRegExp(companyName)}\\b\\s*`, "i"), ""));
  }

  text = normalize(text.replace(/^about\s+([A-Za-z0-9][\w.&'-]*)\s+\1\b\s*/i, "$1 "));
  return text;
}

export function truncateJobSummary(value: string, max = SUMMARY_MAX): string {
  const text = normalize(value);
  if (text.length <= max) return text;
  const slice = text.slice(0, max - 1);
  const cut = slice.lastIndexOf(" ");
  const base = (cut > 80 ? slice.slice(0, cut) : slice).trimEnd();
  return `${base}…`;
}

export type JobSummary = {
  text: string;
  /** "ai" only when the text came from a generated summary field. */
  kind: "ai" | "excerpt";
};

/**
 * Hook for a generated summary: pass `generatedSummary` when a stored or
 * previously computed summary exists. Otherwise this returns the sanitized
 * description, truncated to 160 characters, and kind "excerpt".
 */
export function buildJobSummary(input: {
  description?: string | null;
  company?: string | null;
  generatedSummary?: string | null;
}): JobSummary | null {
  const generated = input.generatedSummary?.replace(/\s+/g, " ").trim();
  if (generated) {
    return { text: truncateJobSummary(generated), kind: "ai" };
  }
  const excerpt = sanitizeJobDescription(input.description ?? "", input.company);
  if (!excerpt) return null;
  return { text: truncateJobSummary(excerpt), kind: "excerpt" };
}

export function jobSummaryLabel(kind: JobSummary["kind"]): "AI summary" | "Summary" {
  return kind === "ai" ? "AI summary" : "Summary";
}
