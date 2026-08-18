import { z } from "zod";

import { LIMITS, optionalTrimmed } from "./primitives";

export const jobFeedSourceSchema = z.enum([
  "greenhouse",
  "lever",
  "adzuna",
  "usajobs",
  "workday",
  "smartrecruiters",
  "ashby",
  "jobvite",
  "bamboohr",
  "icims",
  "taleo",
  "linkedin",
  "reddit",
  "x",
  "remoteok",
  "remotejobs",
  "hackernews",
  "jobicy",
  "arbeitnow",
  "rss",
  "indeed",
  "glassdoor",
  "levels",
  "facebook",
  "workgraph",
  "other",
]);

export const jobCardKindSchema = z.enum(["listing", "post"]);

export const communityJobClassificationSchema = z.enum([
  "employer_hiring",
  "candidate_for_hire",
  "freelance",
  "internship",
  "remote",
  "discussion_only",
]);

/** Canonical job listing fields used by the catalog and clients. */
export const jobSchema = z.object({
  id: z.union([z.string().trim().min(1).max(LIMITS.jobId), z.number().int()]),
  title: z.string().trim().min(1, "Job title is required.").max(LIMITS.jobTitle),
  company: z.string().trim().min(1, "Company is required.").max(LIMITS.company),
  location: z.string().trim().max(LIMITS.location).optional(),
  description: z.string().trim().max(LIMITS.jobDescription).optional(),
  apply_url: z.string().trim().max(LIMITS.url).optional(),
  source: z.string().trim().max(64).optional(),
  posted_at: z.string().trim().max(40).nullable().optional(),
  kind: jobCardKindSchema.optional(),
  classification: communityJobClassificationSchema.optional(),
});

export type JobInput = z.infer<typeof jobSchema>;

export const talentIntelligenceAnalyzeSchema = z.object({
  jobDescription: z
    .string()
    .trim()
    .min(80, "Job description must be at least 80 characters.")
    .max(LIMITS.jobDescription, "Job description is too long."),
  jobId: z.preprocess(
    (value) => (value == null || value === "" ? undefined : String(value)),
    z.string().trim().max(LIMITS.jobId).optional().nullable(),
  ),
  jobTitle: optionalTrimmed(LIMITS.jobTitle),
  company: optionalTrimmed(LIMITS.company),
  forceRefresh: z.boolean().optional(),
});

export type TalentIntelligenceAnalyzeInput = z.infer<typeof talentIntelligenceAnalyzeSchema>;
