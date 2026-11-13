/**
 * Authorization decisions for Interview Vault reporting.
 * Anonymous reporting is intentionally disallowed: reporters must be signed in
 * so RLS can scope rows to reporter_id, rate limits can key on user id, and
 * moderators can act on abuse without an anonymous flood surface.
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
