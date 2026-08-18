import { z } from "zod";

/** Shared length caps for user-facing fields. */
export const LIMITS = {
  name: 200,
  email: 254,
  headline: 300,
  summary: 8000,
  location: 200,
  phone: 40,
  url: 500,
  skill: 80,
  skills: 100,
  experienceItems: 50,
  educationItems: 50,
  certifications: 50,
  certification: 200,
  jobTitle: 300,
  company: 200,
  duration: 120,
  description: 8000,
  notes: 8000,
  jobId: 128,
  query: 200,
  pageSize: 4000,
  resumeText: 400_000,
  jobDescription: 32_000,
  years: 60,
} as const;

export const optionalTrimmed = (max: number, message?: string) =>
  z
    .string()
    .trim()
    .max(max, message ?? `Must be ${max} characters or fewer.`)
    .optional();

export const trimmedField = (max: number, opts?: { min?: number; requiredMessage?: string }) => {
  const min = opts?.min ?? 0;
  let schema = z.string().trim().max(max, `Must be ${max} characters or fewer.`);
  if (min > 0) {
    schema = schema.min(min, opts?.requiredMessage ?? "This field is required.");
  }
  return schema;
};

export const optionalEmail = z
  .union([
    z.literal(""),
    z.null(),
    z.string().trim().max(LIMITS.email, "Email is too long.").email("Enter a valid email address."),
  ])
  .optional()
  .transform((value) => (typeof value === "string" && value ? value : undefined));

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .max(LIMITS.email, "Email is too long.")
  .email("Enter a valid email address.");

/** Optional URL or empty string. Does not require a scheme — matches existing profile data. */
export const optionalLink = z
  .string()
  .trim()
  .max(LIMITS.url, "Link is too long.")
  .optional()
  .or(z.literal(""));

export const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date in YYYY-MM-DD format.");

export const optionalIsoDate = z
  .string()
  .trim()
  .refine((s) => s === "" || /^\d{4}-\d{2}-\d{2}$/.test(s), "Use a date in YYYY-MM-DD format.")
  .optional()
  .or(z.literal(""));

export const uuidSchema = z.string().trim().uuid("Invalid id.");

export function stringList(maxItems: number, maxItemLength: number) {
  return z
    .array(z.string().trim().min(1).max(maxItemLength, `Each item must be ${maxItemLength} characters or fewer.`))
    .max(maxItems, `At most ${maxItems} items are allowed.`);
}

/** Coerce unknown into a trimmed string list (AI / loose JSON). */
export function coerceStringList(maxItems: number, maxItemLength: number) {
  return z.unknown().transform((value) => {
    if (!Array.isArray(value)) return [];
    const out: string[] = [];
    for (const item of value) {
      if (typeof item !== "string") continue;
      const trimmed = item.trim().slice(0, maxItemLength);
      if (trimmed) out.push(trimmed);
      if (out.length >= maxItems) break;
    }
    return out;
  });
}

export function coerceTrimmedString(max: number, fallback = "") {
  return z.unknown().transform((value) => {
    if (typeof value === "string") return value.trim().slice(0, max);
    if (typeof value === "number" && Number.isFinite(value)) return String(value).slice(0, max);
    return fallback;
  });
}

export function coerceNullableString(max: number) {
  return z.unknown().transform((value) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim().slice(0, max);
    return trimmed || null;
  });
}

export function coerceScore(fallback = 0) {
  return z.unknown().transform((value) => {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.min(100, Math.round(n)));
  });
}

export function commaList(raw: string | undefined, maxItems: number, maxItem: number): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim().slice(0, maxItem))
    .filter(Boolean)
    .slice(0, maxItems);
}
