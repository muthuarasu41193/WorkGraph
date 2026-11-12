/**
 * Honest Interview Vault trust labels.
 * Never use a vague "verified" badge. Labels describe the check that was made.
 */

export const VAULT_TRUST_STATUSES = [
  "company_email_confirmed",
  "past_employment_reviewed",
  "interview_evidence_reviewed",
  "outcome_self_reported",
  "not_independently_verified",
] as const;

export type VaultTrustStatus = (typeof VAULT_TRUST_STATUSES)[number];

export const VAULT_TRUST_LABELS: Record<VaultTrustStatus, string> = {
  company_email_confirmed: "Current company email confirmed",
  past_employment_reviewed: "Past employment reviewed",
  interview_evidence_reviewed: "Interview evidence reviewed",
  outcome_self_reported: "Outcome self-reported",
  not_independently_verified: "Not independently verified",
};

export const VAULT_TRUST_EXPLANATIONS: Record<VaultTrustStatus, string> = {
  company_email_confirmed:
    "The contributor demonstrated access to a supported company email at the time of verification. This does not prove past employment or that an interview occurred.",
  past_employment_reviewed:
    "Limited evidence or an authorized verification service was reviewed. Availability varies. This does not prove interview participation.",
  interview_evidence_reviewed:
    "Optional, redacted evidence that an interview occurred was reviewed. This does not verify every detail in the guide.",
  outcome_self_reported:
    "The contributor’s reported offer or rejection has not been independently confirmed.",
  not_independently_verified:
    "The guide is available, but WorkGraph has not independently checked the relevant claim.",
};

/** Default public trust set for guides until stronger checks exist. */
export function defaultVaultTrustStatuses(hasOutcome: boolean): VaultTrustStatus[] {
  const statuses: VaultTrustStatus[] = ["not_independently_verified"];
  if (hasOutcome) statuses.unshift("outcome_self_reported");
  return statuses;
}

export function isVaultTrustStatus(value: string): value is VaultTrustStatus {
  return (VAULT_TRUST_STATUSES as readonly string[]).includes(value);
}

export function normalizeVaultTrustStatuses(values: unknown, hasOutcome: boolean): VaultTrustStatus[] {
  if (!Array.isArray(values) || values.length === 0) {
    return defaultVaultTrustStatuses(hasOutcome);
  }
  const parsed = values.filter((v): v is VaultTrustStatus => typeof v === "string" && isVaultTrustStatus(v));
  return parsed.length > 0 ? [...new Set(parsed)] : defaultVaultTrustStatuses(hasOutcome);
}

export const VAULT_REPORT_REASONS = [
  "misleading",
  "inaccessible_after_purchase",
  "confidential_or_personal",
  "infringing",
  "other",
] as const;

export type VaultReportReason = (typeof VAULT_REPORT_REASONS)[number];

export const VAULT_REPORT_REASON_LABELS: Record<VaultReportReason, string> = {
  misleading: "Materially misrepresented content",
  inaccessible_after_purchase: "Paid content inaccessible after purchase",
  confidential_or_personal: "Confidential, personal, or non-consensual content",
  infringing: "Infringing or scraped third-party content",
  other: "Other concern",
};

export function isVaultReportReason(value: string): value is VaultReportReason {
  return (VAULT_REPORT_REASONS as readonly string[]).includes(value);
}

export const CONTRIBUTOR_GUIDANCE = [
  "Share only experiences you personally had. Do not invent or scrape third-party posts.",
  "Do not include confidential interview questions you are not allowed to share, full offer letters, or other people’s personal data.",
  "You may use a public pseudonym. Never publish work email addresses or verification documents.",
  "Outcomes you enter are self-reported unless a separate trust label says a check was made.",
] as const;
