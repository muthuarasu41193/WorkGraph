/**
 * Interview Vault guide report reasons and moderation statuses.
 * Reasons are an extensible closed set (Postgres check + TS const).
 * Milestone V4 may add inaccessible / materially-misrepresented variants;
 * keep labels honest and do not imply legal conclusions.
 */

export const VAULT_REPORT_REASONS = [
  "inaccurate_or_outdated",
  "confidential_or_personal",
  "copied_from_third_party",
  "spam_or_abuse",
  "other",
  // Reserved slots for Milestone V4 (already in schema check once added):
  "inaccessible_after_purchase",
  "materially_misrepresented",
] as const;

export type VaultReportReason = (typeof VAULT_REPORT_REASONS)[number];

/** Reasons shown in the buyer/reporter UI today (subset of the extensible enum). */
export const VAULT_REPORT_REASONS_UI = [
  "inaccurate_or_outdated",
  "confidential_or_personal",
  "copied_from_third_party",
  "spam_or_abuse",
  "other",
] as const satisfies readonly VaultReportReason[];

export const VAULT_REPORT_REASON_LABELS: Record<VaultReportReason, string> = {
  inaccurate_or_outdated: "Inaccurate or outdated",
  confidential_or_personal: "Confidential or someone else’s personal details",
  copied_from_third_party: "Copied from a third-party platform",
  spam_or_abuse: "Spam or abuse",
  other: "Other",
  inaccessible_after_purchase: "Paid content inaccessible after purchase",
  materially_misrepresented: "Materially misrepresented content",
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

/** Setting a report to removed should hide the guide from Vault browse + prep-pack matches. */
export function reportStatusRemovesGuide(status: VaultReportStatus): boolean {
  return status === "removed";
}
