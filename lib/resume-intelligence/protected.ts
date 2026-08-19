/**
 * Strip protected / sensitive attributes. Never infer or persist them.
 * If a model emits these keys or phrases, drop them before save/display.
 */

const FORBIDDEN_OBJECT_KEYS = new Set([
  "age",
  "date_of_birth",
  "dob",
  "gender",
  "sex",
  "gender_identity",
  "race",
  "ethnicity",
  "national_origin",
  "nationality",
  "citizenship",
  "religion",
  "caste",
  "sexual_orientation",
  "pregnancy",
  "disability",
  "health",
  "medical",
  "political_affiliation",
  "political_opinion",
  "union_membership",
  "marital_status",
  "photo",
  "headshot",
]);

const FORBIDDEN_LABEL_RE =
  /\b(gender|sex|race|ethnicity|religion|caste|sexual orientation|sexuality|disability|pregnant|pregnancy|date of birth|d\.?o\.?b\.?|age\s*:|citizenship|national origin|political (party|affiliation)|union membership|marital status|ssn|social security)\b/i;

export function isForbiddenKey(key: string): boolean {
  return FORBIDDEN_OBJECT_KEYS.has(key.trim().toLowerCase().replace(/[\s-]+/g, "_"));
}

export function stripProtectedFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map(stripProtectedFields)
      .filter((item) => {
        if (typeof item === "string") return !FORBIDDEN_LABEL_RE.test(item);
        return item != null;
      });
  }
  if (!value || typeof value !== "object") {
    if (typeof value === "string" && FORBIDDEN_LABEL_RE.test(value) && /:\s*\S/.test(value)) {
      return undefined;
    }
    return value;
  }
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (isForbiddenKey(key)) continue;
    const cleaned = stripProtectedFields(child);
    if (cleaned !== undefined) out[key] = cleaned;
  }
  return out;
}

export function dropProtectedLines(text: string): string {
  return text
    .split("\n")
    .filter((line) => !FORBIDDEN_LABEL_RE.test(line) || !/:\s*\S/.test(line))
    .join("\n");
}
