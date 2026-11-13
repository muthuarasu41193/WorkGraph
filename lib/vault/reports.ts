/**
 * Interview Vault guide report reasons and moderation statuses.
 * Milestone V4 exposes inaccessible / materially-misrepresented / outdated reasons in the UI.
 * Keep labels honest and do not imply legal conclusions.
 */

export const VAULT_REPORT_REASONS = [
  "inaccurate_or_outdated",
  "confidential_or_personal",
  "copied_from_third_party",
  "spam_or_abuse",
  "other",
  "inaccessible_after_purchase",
  "materially_misrepresented",
] as const;

export type VaultReportReason = (typeof VAULT_REPORT_REASONS)[number];

/**
 * Reasons shown in the reporter UI (Milestone B + V4).
 * Labels avoid implying legal findings.
 */
export const VAULT_REPORT_REASONS_UI = [
  "inaccessible_after_purchase",
  "materially_misrepresented",
  "inaccurate_or_outdated",
  "copied_from_third_party",
  "confidential_or_personal",
  "spam_or_abuse",
  "other",
] as const satisfies readonly VaultReportReason[];

export const VAULT_REPORT_REASON_LABELS: Record<VaultReportReason, string> = {
  inaccessible_after_purchase: "Inaccessible content after purchase",
  materially_misrepresented: "Materially misrepresented content",
  inaccurate_or_outdated: "Outdated or inaccurate information",
  copied_from_third_party: "Copied or unauthorized content",
  confidential_or_personal: "Confidential or personal data",
  spam_or_abuse: "Spam or abuse",
  other: "Other",
};

export const VAULT_REPORT_STATUSES = ["open", "under_review", "removed", "dismissed"] as const;
export type VaultReportStatus = (typeof VAULT_REPORT_STATUSES)[number];

export const VAULT_REPORT_STATUS_LABELS: Record<VaultReportStatus, string> = {
  open: "Open",
  under_review: "Under review",
  removed: "Removed",
  dismissed: "Dismissed",
};

export const VAULT_REPORT_DETAILS_MAX = 2000;

export function isVaultReportReason(value: string): value is VaultReportReason {
  return (VAULT_REPORT_REASONS as readonly string[]).includes(value);
}

export function isVaultReportStatus(value: string): value is VaultReportStatus {
  return (VAULT_REPORT_STATUSES as readonly string[]).includes(value);
}

/** Setting a report to removed should hide the guide from Vault browse. */
export function reportStatusRemovesGuide(status: VaultReportStatus): boolean {
  return status === "removed";
}

/** Review report reasons (separate from guide reports). */
export const VAULT_REVIEW_REPORT_REASONS = [
  "abuse_or_harassment",
  "spam",
  "off_topic",
  "personal_data",
  "other",
] as const;

export type VaultReviewReportReason = (typeof VAULT_REVIEW_REPORT_REASONS)[number];

export const VAULT_REVIEW_REPORT_REASON_LABELS: Record<VaultReviewReportReason, string> = {
  abuse_or_harassment: "Abuse or harassment",
  spam: "Spam",
  off_topic: "Off topic",
  personal_data: "Personal data",
  other: "Other",
};

export const VAULT_REVIEW_REPORT_DETAILS_MAX = 1000;

export function isVaultReviewReportReason(value: string): value is VaultReviewReportReason {
  return (VAULT_REVIEW_REPORT_REASONS as readonly string[]).includes(value);
}
