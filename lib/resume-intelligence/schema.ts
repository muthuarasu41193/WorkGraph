import { z } from "zod";

import { LIMITS } from "@/lib/validation/primitives";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@/lib/embeddings";
import { OWNER_RESUME_FILE_PATH as OWNER_RESUME_FILE_ROUTE } from "@/lib/security/resume-access";

export const RESUME_INTELLIGENCE_SCHEMA_VERSION = "resume-intelligence-v1";
export const RESUME_EMBEDDING_MODEL = EMBEDDING_MODEL;
export const RESUME_EMBEDDING_DIMENSIONS = EMBEDDING_DIMENSIONS;
export const OWNER_RESUME_FILE_PATH = OWNER_RESUME_FILE_ROUTE;

const confidence = z
  .number()
  .min(0)
  .max(1)
  .transform((value) => Math.round(value * 100) / 100);

export const confidentValueSchema = z.object({
  value: z.string().trim().min(1).max(LIMITS.description),
  confidence,
});

export const confidentSkillSchema = z.object({
  skill: z.string().trim().min(1).max(LIMITS.skill),
  confidence,
  canonical: z.string().trim().min(1).max(LIMITS.skill).optional(),
  category: z.enum(["technical", "soft", "other"]).optional(),
});

export const identitySchema = z.object({
  full_name: confidentValueSchema.nullable(),
  email: confidentValueSchema.nullable(),
  phone: confidentValueSchema.nullable(),
  location: confidentValueSchema.nullable(),
  headline: confidentValueSchema.nullable(),
  linkedin_url: confidentValueSchema.nullable(),
  github_url: confidentValueSchema.nullable(),
  website_url: confidentValueSchema.nullable(),
});

export const experienceItemSchema = z.object({
  title: z.string().trim().max(LIMITS.jobTitle),
  company: z.string().trim().max(LIMITS.company),
  duration: z.string().trim().max(LIMITS.duration),
  description: z.string().trim().max(LIMITS.description),
  start_date: z.string().trim().max(10).nullable(),
  end_date: z.string().trim().max(10).nullable(),
  is_current: z.boolean(),
  confidence,
});

export const educationItemSchema = z.object({
  degree: z.string().trim().max(LIMITS.jobTitle),
  institution: z.string().trim().max(LIMITS.company),
  year: z.string().trim().max(LIMITS.duration),
  start_year: z.string().trim().max(4).nullable(),
  end_year: z.string().trim().max(4).nullable(),
  confidence,
});

export const projectItemSchema = z.object({
  name: z.string().trim().max(LIMITS.jobTitle),
  description: z.string().trim().max(LIMITS.description),
  confidence,
});

export const certificationItemSchema = z.object({
  name: z.string().trim().max(LIMITS.certification),
  confidence,
});

export const timelineEntrySchema = z.object({
  kind: z.enum(["experience", "education"]),
  title: z.string().trim().max(LIMITS.jobTitle),
  organization: z.string().trim().max(LIMITS.company),
  start_date: z.string().trim().max(10).nullable(),
  end_date: z.string().trim().max(10).nullable(),
  is_current: z.boolean(),
  confidence,
});

export const employmentPreferencesSchema = z.object({
  location_mode: z.enum(["any", "remote", "hybrid", "onsite"]).nullable(),
  job_types: z.array(z.string().trim().max(40)).max(8),
  willing_to_relocate: z.boolean().nullable(),
  notes: z.array(z.string().trim().max(300)).max(8),
});

export const qualityIndicatorSchema = z.object({
  category: z.string().trim().max(80),
  status: z.enum(["good", "warning", "critical"]),
  observation: z.string().trim().max(400),
  recommendation: z.string().trim().max(400),
});

export const qualityAnalysisSchema = z.object({
  overall_score: z.number().int().min(0).max(100),
  completeness: z.number().int().min(0).max(100),
  indicators: z.array(qualityIndicatorSchema).max(20),
  estimate_disclaimer:
    z.string().trim().min(1).max(300),
});

export const embeddingRecordSchema = z.object({
  model: z.literal(RESUME_EMBEDDING_MODEL),
  dimensions: z.literal(RESUME_EMBEDDING_DIMENSIONS),
  vector: z.array(z.number()).length(RESUME_EMBEDDING_DIMENSIONS),
});

export const normalizedResumeSchema = z.object({
  schema_version: z.literal(RESUME_INTELLIGENCE_SCHEMA_VERSION),
  identity: identitySchema,
  professional_summary: confidentValueSchema.nullable(),
  target_roles: z.array(confidentValueSchema).max(12),
  skills: z.array(confidentSkillSchema).max(LIMITS.skills),
  technical_skills: z.array(confidentSkillSchema).max(LIMITS.skills),
  soft_skills: z.array(confidentSkillSchema).max(40),
  experience: z.array(experienceItemSchema).max(LIMITS.experienceItems),
  education: z.array(educationItemSchema).max(LIMITS.educationItems),
  certifications: z.array(certificationItemSchema).max(LIMITS.certifications),
  projects: z.array(projectItemSchema).max(30),
  achievements: z.array(confidentValueSchema).max(30),
  industries: z.array(confidentValueSchema).max(20),
  locations: z.array(confidentValueSchema).max(20),
  years_of_experience: z
    .object({
      value: z.number().int().min(0).max(LIMITS.years),
      confidence,
      basis: z.enum(["timeline", "stated", "unknown"]),
    })
    .nullable(),
  career_timeline: z.array(timelineEntrySchema).max(80),
  seniority: z
    .object({
      value: z.string().trim().max(40),
      confidence,
    })
    .nullable(),
  employment_preferences: employmentPreferencesSchema,
  quality: qualityAnalysisSchema,
  embedding: embeddingRecordSchema.optional(),
});

export type ConfidentValue = z.infer<typeof confidentValueSchema>;
export type ConfidentSkill = z.infer<typeof confidentSkillSchema>;
export type NormalizedResume = z.infer<typeof normalizedResumeSchema>;
export type QualityAnalysis = z.infer<typeof qualityAnalysisSchema>;
export type EmbeddingRecord = z.infer<typeof embeddingRecordSchema>;
export type EmploymentPreferences = z.infer<typeof employmentPreferencesSchema>;

export function parseNormalizedResume(data: unknown): NormalizedResume {
  return normalizedResumeSchema.parse(data);
}

/** Persistable snapshot: no embedding vector (stored in dedicated columns). */
export function toStoredResumeIntelligence(resume: NormalizedResume): Omit<NormalizedResume, "embedding"> {
  const { embedding: _embedding, ...rest } = resume;
  return rest;
}
