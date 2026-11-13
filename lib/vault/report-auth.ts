/**
 * Authorization decisions for Interview Vault reporting.
 * Anonymous reporting is intentionally disallowed.
 */

export type VaultReportAuthDecision =
  | { allowed: true }
  | { allowed: false; status: number; error: string };

export function authorizeVaultReportSubmit(input: {
  userId: string | null | undefined;
}): VaultReportAuthDecision {
  if (!input.userId) {
    return { allowed: false, status: 401, error: "Sign in to report a guide." };
  }
  return { allowed: true };
}

/**
 * Admin moderation uses the same ADMIN_EMAILS gate as /admin/metrics.
 * Non-admins receive 404 (not 403) so the surface stays unlisted.
 */
export function authorizeVaultReportStatusUpdate(input: {
  actorEmail: string | null | undefined;
  adminEmailsConfigured: boolean;
  isAdmin: boolean;
}): VaultReportAuthDecision {
  if (!input.adminEmailsConfigured || !input.actorEmail || !input.isAdmin) {
    return { allowed: false, status: 404, error: "Not found" };
  }
  return { allowed: true };
}

export function authorizeVaultReviewReportSubmit(input: {
  userId: string | null | undefined;
}): VaultReportAuthDecision {
  if (!input.userId) {
    return { allowed: false, status: 401, error: "Sign in to report a review." };
  }
  return { allowed: true };
}

export function authorizeVaultRefundAdminTransition(input: {
  actorEmail: string | null | undefined;
  adminEmailsConfigured: boolean;
  isAdmin: boolean;
}): VaultReportAuthDecision {
  if (!input.adminEmailsConfigured || !input.actorEmail || !input.isAdmin) {
    return { allowed: false, status: 404, error: "Not found" };
  }
  return { allowed: true };
}
