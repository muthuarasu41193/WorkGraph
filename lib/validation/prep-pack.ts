import { z } from "zod";

import { PREP_ROLE_IDS } from "@/lib/prep-pack/roles";
import { LIMITS, trimmedField, uuidSchema } from "./primitives";

const PREP_ROLE_ID_SET = new Set<string>(PREP_ROLE_IDS);

const roleIdSchema = z
  .string()
  .trim()
  .refine((value) => PREP_ROLE_ID_SET.has(value), "Choose a role from the list.");

export const prepPackBuildSchema = z
  .object({
    jobDescription: z
      .string()
      .trim()
      .max(LIMITS.jobDescription, `Job description must be ${LIMITS.jobDescription} characters or fewer.`)
      .optional(),
    roleId: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    const jd = value.jobDescription?.trim() ?? "";
    const roleRaw = value.roleId?.trim() ?? "";
    const hasRole = Boolean(roleRaw);

    if (roleRaw && !PREP_ROLE_ID_SET.has(roleRaw)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose a role from the list.",
        path: ["roleId"],
      });
    }

    if (!hasRole && !jd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Paste a job description or choose a role.",
        path: ["jobDescription"],
      });
      return;
    }

    if (jd && jd.length < 40 && !hasRole) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Job description must be at least 40 characters, or choose a role.",
        path: ["jobDescription"],
      });
    }
  })
  .transform((value) => {
    const jobDescription = value.jobDescription?.trim() ? value.jobDescription.trim() : undefined;
    const roleId = value.roleId?.trim() && PREP_ROLE_ID_SET.has(value.roleId.trim()) ? value.roleId.trim() : undefined;
    return { jobDescription, roleId };
  });

export type PrepPackBuildInput = z.infer<typeof prepPackBuildSchema>;

const skillSaveSchema = z.object({
  name: trimmedField(LIMITS.skill, { min: 1 }),
  source: z.enum(["job_description", "role_focus"]),
});

const guideSaveSchema = z.object({
  id: uuidSchema,
  company: trimmedField(LIMITS.company, { min: 1 }),
  role: trimmedField(LIMITS.jobTitle, { min: 1 }),
  level: z.string().trim().max(120).nullable(),
  difficulty: z.string().trim().max(40).nullable(),
  rounds: z.number().int().min(0).max(40).nullable(),
  avg_rating: z.number().min(0).max(5).nullable(),
  price_inr: z.number().int().min(0).max(1_000_000),
  href: z
    .string()
    .trim()
    .max(200)
    .regex(/^\/interview-vault\/[0-9a-f-]{36}$/i, "Guide link must point at Interview Vault."),
  why: z.array(trimmedField(200, { min: 1 })).max(8),
  score: z.number().int().min(0).max(10_000),
});

const checklistSaveSchema = z.object({
  id: trimmedField(80, { min: 1 }),
  text: trimmedField(500, { min: 1 }),
  round: trimmedField(120, { min: 1 }),
});

/** Derived pack only — never accepts a raw job description field. */
export const prepPackSaveSchema = z
  .object({
    roleId: z.union([roleIdSchema, z.null()]).optional(),
    roleLabel: z.union([z.string().trim().max(120), z.null()]).optional(),
    skills: z.array(skillSaveSchema).max(40),
    guides: z.array(guideSaveSchema).max(10),
    checklist: z.array(checklistSaveSchema).max(30),
    estimateNotice: trimmedField(400, { min: 1 }),
  })
  .transform((value) => ({
    roleId: value.roleId ?? null,
    roleLabel: value.roleLabel ?? null,
    skills: value.skills,
    guides: value.guides,
    checklist: value.checklist,
    estimateNotice: value.estimateNotice,
  }));

export type PrepPackSaveInput = z.infer<typeof prepPackSaveSchema>;

export const prepPackIdSchema = uuidSchema;
