/**
 * One staleness threshold for the jobs list, the job page, and match ranking.
 * A posting is stale after this many full days. Day 30 is still current; day 31 is stale.
 * Ranking still applies the existing penalty only when this check is true.
 */
export const STALE_AFTER_DAYS = 30

export function postedAgeDays(iso: string | null | undefined, now = Date.now()): number | null {
  if (!iso) return null
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return null
  return Math.floor((now - then) / 86_400_000)
}

export function isJobStale(iso: string | null | undefined, now = Date.now()): boolean {
  const days = postedAgeDays(iso, now)
  return days != null && days > STALE_AFTER_DAYS
}
