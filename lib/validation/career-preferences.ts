import { z } from "zod";

import { LIMITS, optionalTrimmed } from "./primitives";
import { skillsInputSchema } from "./skills";

export const locationModeSchema = z.enum(["any", "remote", "hybrid", "onsite"]);

export const jobTypeSchema = z.enum([
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
  "Internship",
  "Temporary",
]);

export const experienceLevelSchema = z.enum([
  "any",
  "Entry (0-2yr)",
  "Mid (2-5yr)",
  "Senior (5-8yr)",
  "Lead (8-12yr)",
  "Executive (12yr+)",
]);

export const salaryPeriodSchema = z.enum(["year", "hour"]);

/**
 * Career search / preference payload. No dedicated table today; reused by
 * job search UI and any future preference API.
 */
export const careerPreferencesSchema = z
  .object({
    targetRoles: z
      .array(z.string().trim().min(1).max(LIMITS.jobTitle))
      .max(20)
      .optional(),
    preferredLocations: z
      .array(z.string().trim().min(1).max(LIMITS.location))
      .max(20)
      .optional(),
    locationMode: locationModeSchema.optional(),
    jobTypes: z.array(jobTypeSchema).max(8).optional(),
    experienceLevel: experienceLevelSchema.optional(),
    salaryMin: z.number().int().min(0).max(10_000).optional(),
    salaryMax: z.number().int().min(0).max(10_000).optional(),
    currency: z.string().trim().max(8).optional(),
    salaryPeriod: salaryPeriodSchema.optional(),
    visaSponsorshipOnly: z.boolean().optional(),
    easyApplyOnly: z.boolean().optional(),
    skills: skillsInputSchema.optional(),
    headline: optionalTrimmed(LIMITS.headline),
    summary: optionalTrimmed(LIMITS.summary),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.salaryMin != null &&
      value.salaryMax != null &&
      value.salaryMin > value.salaryMax
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["salaryMin"],
        message: "Minimum salary cannot be greater than maximum salary.",
      });
    }
  });

export type CareerPreferences = z.infer<typeof careerPreferencesSchema>;
