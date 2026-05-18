/**
 * Comma- or newline-separated emails allowed to trigger community job sync (POST /api/sync-community-jobs).
 * Case-insensitive match against the signed-in Supabase user email.
 */
export function getCommunityJobsAdminEmailSet(): Set<string> {
  const raw = process.env.COMMUNITY_JOBS_ADMIN_EMAILS?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .replace(/\r/g, "")
      .split(/[\n,;]+/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isCommunityJobsAdminEmail(email: string | undefined | null): boolean {
  if (!email?.trim()) return false;
  const set = getCommunityJobsAdminEmailSet();
  if (set.size === 0) return false;
  return set.has(email.trim().toLowerCase());
}

export function isCommunityJobsAdminListConfigured(): boolean {
  return getCommunityJobsAdminEmailSet().size > 0;
}
