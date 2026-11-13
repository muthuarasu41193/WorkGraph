import { z } from "zod";

import { VAULT_ATTESTATION_VERSION } from "@/lib/vault/attestation";
import { VAULT_REPORT_DETAILS_MAX, VAULT_REPORT_REASONS, VAULT_REPORT_STATUSES } from "@/lib/vault/reports";
import { LIMITS, trimmedField, uuidSchema } from "@/lib/validation/primitives";

export const vaultSkillSchema = z
  .string()
  .trim()
  .min(1)
  .max(LIMITS.skill)
  .transform((value) => value.slice(0, LIMITS.skill));

export const vaultSkillsSchema = z.array(vaultSkillSchema).max(40);

export const vaultReportBodySchema = z
  .object({
    reason: z.enum(VAULT_REPORT_REASONS),
    details: z
      .string()
      .trim()
      .max(VAULT_REPORT_DETAILS_MAX)
      .optional()
      .nullable(),
  })
  .strict();

export const vaultAdminReportStatusSchema = z
  .object({
    status: z.enum(VAULT_REPORT_STATUSES),
  })
  .strict();

export const vaultPublishAttestationSchema = z
  .object({
    attestation_accepted: z.literal(true),
    attestation_version: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .default(VAULT_ATTESTATION_VERSION),
  })
  .strict();

export const vaultExperienceIdSchema = uuidSchema;

export const vaultInterviewRoundSchema = trimmedField(120).nullable().optional();
