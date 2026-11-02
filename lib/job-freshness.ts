import { postedAgeDays, STALE_AFTER_DAYS } from "./job-staleness";

/** Plain-language posted time. Unknown dates are omitted rather than invented. */
export function formatJobFreshness(iso: string | null | undefined, now = Date.now()): string | null {
  const days = postedAgeDays(iso, now);
  if (days == null || days < 0) return null;
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days > STALE_AFTER_DAYS) return `Posted ${days} days ago, may no longer be open`;
  return `Posted ${days} days ago`;
}
