import { z } from "zod";

import { LIMITS, uuidSchema } from "./primitives";

export const coverLetterIdSchema = uuidSchema;

export const coverLetterGenerateSchema = z.object({
  jobTitle: z.string().trim().min(1, "Job title is required.").max(LIMITS.jobTitle, "Job title is too long."),
  company: z.string().trim().min(1, "Company is required.").max(LIMITS.company, "Company is too long."),
  jobDescription: z
    .string()
    .trim()
    .min(1, "Job description is required.")
    .max(LIMITS.jobDescription, "Job description is too long."),
});

export type CoverLetterGenerateInput = z.infer<typeof coverLetterGenerateSchema>;

export const coverLetterSaveSchema = z.object({
  jobTitle: z.string().trim().min(1, "Job title is required.").max(LIMITS.jobTitle, "Job title is too long."),
  company: z.string().trim().min(1, "Company is required.").max(LIMITS.company, "Company is too long."),
  jobDescription: z
    .string()
    .trim()
    .max(LIMITS.jobDescription, "Job description is too long.")
    .optional()
    .transform((value) => (value ? value : undefined)),
  letter: z
    .string()
    .trim()
    .min(1, "Cover letter is required.")
    .max(LIMITS.coverLetter, "Cover letter is too long."),
});

export type CoverLetterSaveInput = z.infer<typeof coverLetterSaveSchema>;
