/**
 * Comma- or newline-separated emails allowed to view /admin/metrics.
 * Case-insensitive match against the signed-in session email.
 * Server-only env: ADMIN_EMAILS.
 */
export function getAdminEmailSet(): Set<string> {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .replace(/\r/g, "")
      .split(/[\n,;]+/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email?.trim()) return false;
  const set = getAdminEmailSet();
  if (set.size === 0) return false;
  return set.has(email.trim().toLowerCase());
}

export function isAdminListConfigured(): boolean {
  return getAdminEmailSet().size > 0;
}

/** Access decision for the founder metrics page. Non-admins must see notFound(). */
export function resolveAdminMetricsAccess(email: string | undefined | null): "ok" | "not_found" {
  return isAdminEmail(email) ? "ok" : "not_found";
}
