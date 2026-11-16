import { z } from "zod";

import { VAULT_ATTESTATION_VERSION } from "@/lib/vault/attestation";
import {
  VAULT_REPORT_DETAILS_MAX,
  VAULT_REPORT_REASONS,
  VAULT_REPORT_STATUSES,
  VAULT_REVIEW_REPORT_DETAILS_MAX,
  VAULT_REVIEW_REPORT_REASONS,
} from "@/lib/vault/reports";
import {
  VAULT_REFUND_DETAILS_MAX,
  VAULT_REFUND_REASONS,
  VAULT_REFUND_RESPONSE_MAX,
  VAULT_REFUND_STATUSES,
} from "@/lib/vault/refunds";
import { VAULT_REVIEW_COMMENT_MAX, VAULT_REVIEW_RATING_MAX, VAULT_REVIEW_RATING_MIN } from "@/lib/vault/reviews";
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
    details: z.string().trim().max(VAULT_REPORT_DETAILS_MAX).optional().nullable(),
  })
  .strict();

export const vaultAdminReportStatusSchema = z
  .object({
    status: z.enum(VAULT_REPORT_STATUSES),
  })
  .strict();

export const vaultReviewBodySchema = z
  .object({
    rating: z.number().int().min(VAULT_REVIEW_RATING_MIN).max(VAULT_REVIEW_RATING_MAX),
    comment: z.string().trim().max(VAULT_REVIEW_COMMENT_MAX).optional().nullable(),
  })
  .strict();

export const vaultReviewReportBodySchema = z
  .object({
    reason: z.enum(VAULT_REVIEW_REPORT_REASONS),
    details: z.string().trim().max(VAULT_REVIEW_REPORT_DETAILS_MAX).optional().nullable(),
  })
  .strict();

export const vaultRefundRequestBodySchema = z
  .object({
    reason: z.enum(VAULT_REFUND_REASONS),
    details: z.string().trim().max(VAULT_REFUND_DETAILS_MAX).optional().nullable(),
  })
  .strict();

export const vaultRefundContributorResponseSchema = z
  .object({
    response: z.string().trim().min(1).max(VAULT_REFUND_RESPONSE_MAX),
  })
  .strict();

export const vaultAdminRefundStatusSchema = z
  .object({
    status: z.enum(VAULT_REFUND_STATUSES),
    admin_note: z.string().trim().max(1000).optional().nullable(),
  })
  .strict();

export const vaultPublishAttestationSchema = z
  .object({
    attestation_accepted: z.literal(true),
    attestation_version: z.string().trim().min(1).max(80).default(VAULT_ATTESTATION_VERSION),
  })
  .strict();

export const vaultExperienceIdSchema = uuidSchema;

export const vaultAdminHideReviewSchema = z
  .object({
    hidden: z.boolean(),
  })
  .strict();

export const vaultInterviewRoundSchema = trimmedField(120).nullable().optional();
