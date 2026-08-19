import { z } from "zod";

import { MAX_RESUME_UPLOAD_BYTES, MAX_RESUME_UPLOAD_LABEL } from "@/lib/upload-limits";

import { aiEducationSchema } from "./education";
import { ValidationError } from "./errors";
import { aiWorkExperienceSchema } from "./experience";
import { LIMITS, coerceNullableString, coerceScore, coerceStringList, coerceTrimmedString, optionalEmail } from "./primitives";
import { aiCertificationsSchema, aiSkillsSchema } from "./skills";

const ALLOWED_RESUME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function isAllowedResumeFilename(name: string, mimeType?: string | null): boolean {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf") || lower.endsWith(".docx")) return true;
  return Boolean(mimeType && ALLOWED_RESUME_TYPES.has(mimeType));
}

export function isPdfResume(name: string, mimeType?: string | null): boolean {
  return name.toLowerCase().endsWith(".pdf") || mimeType === "application/pdf";
}

export const resumeUploadMetaSchema = z.object({
  name: z.string().trim().min(1, "A file name is required.").max(255, "File name is too long."),
  size: z
    .number()
    .int()
    .nonnegative()
    .max(MAX_RESUME_UPLOAD_BYTES, `File is too large. Maximum size is ${MAX_RESUME_UPLOAD_LABEL}.`),
  type: z.string().max(200).optional(),
});

export type ResumeUploadMeta = z.infer<typeof resumeUploadMetaSchema>;

export const resumeUploadFormFieldsSchema = z.object({
  email: optionalEmail,
});

export function parseResumeUploadFile(
  file: unknown,
  opts?: { pdfOnly?: boolean },
): File {
  if (!(file instanceof File)) {
    throw new ValidationError("No file provided.");
  }
  const meta = resumeUploadMetaSchema.safeParse({
    name: file.name,
    size: file.size,
    type: file.type || undefined,
  });
  if (!meta.success) {
    const first = meta.error.issues[0];
    throw new ValidationError(first?.message ?? "Invalid resume file.");
  }
  if (opts?.pdfOnly) {
    if (!isPdfResume(file.name, file.type)) {
      throw new ValidationError("Only PDF files are supported.");
    }
  } else if (!isAllowedResumeFilename(file.name, file.type)) {
    throw new ValidationError("Only PDF and DOCX files are supported.");
  }
  return file;
}

/**
 * Lenient AI resume parse result. Same shape as the previous normalizeParsedResume
 * helper, with length caps before storage.
 */
export const aiParsedResumeSchema = z.object({
  full_name: coerceTrimmedString(LIMITS.name),
  email: coerceNullableString(LIMITS.email),
  phone: coerceNullableString(LIMITS.phone),
  location: coerceNullableString(LIMITS.location),
  headline: coerceTrimmedString(LIMITS.headline),
  summary: coerceNullableString(LIMITS.summary),
  years_of_experience: z.unknown().transform((value) => {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(LIMITS.years, Math.round(n)));
  }),
  skills: aiSkillsSchema,
  education: aiEducationSchema,
  work_experience: aiWorkExperienceSchema,
  certifications: aiCertificationsSchema,
  linkedin_url: coerceNullableString(LIMITS.url),
  github_url: coerceNullableString(LIMITS.url),
  website_url: coerceNullableString(LIMITS.url),
});

export type AiParsedResume = z.infer<typeof aiParsedResumeSchema>;

export function parseAiParsedResume(data: unknown): AiParsedResume {
  const result = aiParsedResumeSchema.safeParse(data ?? {});
  if (!result.success) {
    return aiParsedResumeSchema.parse({});
  }
  return result.data;
}

const atsGradeSchema = z.enum(["A", "B", "C", "D", "F"]);
const keywordDensitySchema = z.enum(["low", "medium", "high"]);

export const aiAtsFeedbackSchema = z.object({
  score: coerceScore(0),
  grade: z.unknown().transform((value) => {
    if (typeof value === "string") {
      const g = value.trim().toUpperCase();
      const parsed = atsGradeSchema.safeParse(g);
      if (parsed.success) return parsed.data;
    }
    return "F" as const;
  }),
  strengths: coerceStringList(15, 500),
  weaknesses: coerceStringList(15, 500),
  suggestions: coerceStringList(15, 500),
  keyword_density: z.unknown().transform((value) => {
    if (typeof value === "string") {
      const d = value.trim().toLowerCase();
      const parsed = keywordDensitySchema.safeParse(d);
      if (parsed.success) return parsed.data;
    }
    return "low" as const;
  }),
  formatting_score: coerceScore(0),
  content_score: coerceScore(0),
});

export type AiAtsFeedback = z.infer<typeof aiAtsFeedbackSchema>;

export function parseAiAtsFeedback(data: unknown): AiAtsFeedback {
  const result = aiAtsFeedbackSchema.safeParse(data ?? {});
  if (!result.success) {
    return aiAtsFeedbackSchema.parse({});
  }
  return result.data;
}

export const resumeAnalyzeTextSchema = z.object({
  resumeText: z.string().trim().max(LIMITS.resumeText, "Resume text is too long.").optional(),
  targetRole: z.string().trim().max(LIMITS.jobTitle).optional(),
  jobDescription: z.string().trim().max(LIMITS.jobDescription).optional(),
});

export const atsScoreBodySchema = z.object({
  user_id: z.string().trim().uuid("Invalid user id.").optional(),
  email: optionalEmail,
  resume_text: z.string().trim().max(LIMITS.resumeText).optional(),
  job_description: z.string().trim().max(LIMITS.jobDescription).optional(),
});

export const matchJobsBodySchema = z.object({
  resume_text: z
    .string()
    .trim()
    .max(LIMITS.resumeText, "Resume text is too long.")
    .optional(),
  user_id: z.string().trim().uuid("Invalid user id.").optional(),
  top_k: z.coerce.number().int().min(1).max(50).optional(),
});
