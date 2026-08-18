import { z } from "zod";

import { educationLinesSchema, educationListSchema } from "./education";
import { experienceLinesSchema, workExperienceListSchema } from "./experience";
import {
  LIMITS,
  optionalEmail,
  optionalLink,
  optionalTrimmed,
} from "./primitives";
import { certificationsSchema, skillsInputSchema } from "./skills";

const optionalYears = z
  .number()
  .int()
  .min(0)
  .max(LIMITS.years, "Years of experience is too large.")
  .nullable()
  .optional();

/**
 * Manual create-profile / POST /api/profile body.
 * Experience and education may be simple lines (current UI) or structured objects.
 */
export const profileManualInputSchema = z.object({
  email: optionalEmail,
  full_name: optionalTrimmed(LIMITS.name),
  headline: optionalTrimmed(LIMITS.headline),
  summary: optionalTrimmed(LIMITS.summary),
  location: optionalTrimmed(LIMITS.location),
  linkedin_url: optionalLink,
  github_url: optionalLink,
  website_url: optionalLink,
  skills: skillsInputSchema.optional(),
  experience: experienceLinesSchema.optional(),
  education: educationLinesSchema.optional(),
});

export type ProfileManualInput = z.infer<typeof profileManualInputSchema>;

/** Structured profile upsert (v2 / FastAPI / parsed resume fields). */
export const profileUpsertSchema = z.object({
  email: optionalEmail,
  full_name: optionalTrimmed(LIMITS.name),
  headline: optionalTrimmed(LIMITS.headline),
  summary: optionalTrimmed(LIMITS.summary),
  location: optionalTrimmed(LIMITS.location),
  phone: optionalTrimmed(LIMITS.phone),
  linkedin_url: optionalLink,
  github_url: optionalLink,
  website_url: optionalLink,
  skills: skillsInputSchema.optional(),
  work_experience: workExperienceListSchema.optional(),
  education: educationListSchema.optional(),
  certifications: certificationsSchema.optional(),
  resume_raw_text: z.string().max(LIMITS.resumeText, "Resume text is too long.").nullable().optional(),
  profile_completeness: z.number().int().min(0).max(100).nullable().optional(),
  ats_score: z.number().int().min(0).max(100).nullable().optional(),
  ats_feedback: z.record(z.unknown()).nullable().optional(),
  years_of_experience: optionalYears,
});

export type ProfileUpsertInput = z.infer<typeof profileUpsertSchema>;

export const profileHeroPatchSchema = z.object({
  full_name: optionalTrimmed(LIMITS.name),
  headline: optionalTrimmed(LIMITS.headline),
  location: optionalTrimmed(LIMITS.location),
  summary: optionalTrimmed(LIMITS.summary),
});
