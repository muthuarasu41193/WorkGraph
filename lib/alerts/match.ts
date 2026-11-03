/**
 * Pure-ish server matcher for job alerts.
 * One catalog query per alert (via injected fetcher), then score + filter in memory.
 */

import type { JobRow } from "@/lib/job-dashboard";
import type { JobsCatalogFilters } from "@/lib/jobs-catalog";
import { scoreJobRow, type ProfileMatchInput } from "@/lib/job-match";
import { parseJobSearchQuery } from "@/lib/validation/job-search";

import type { AlertMatchJob, JobAlert } from "./types";

export const ALERT_MATCH_LIMIT = 10;

export type AlertCatalogFetch = (filters: JobsCatalogFilters | undefined, since: Date) => Promise<JobRow[]>;

/** Jobs flagged by Prompt 6 scam/payment heuristics must never enter a digest. */
export function isPaymentRequestedJob(row: JobRow & { payment_requested?: boolean | null }): boolean {
  return row.payment_requested === true;
}

function filtersFromAlertQuery(query: string): JobsCatalogFilters | undefined {
  const params = new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);
  return parseJobSearchQuery(params).filters;
}

function postedSince(row: JobRow, since: Date): boolean {
  if (!row.posted_at) return false;
  const posted = new Date(row.posted_at).getTime();
  if (Number.isNaN(posted)) return false;
  return posted >= since.getTime();
}

/**
 * Find up to 10 jobs for an alert posted at or after `since`.
 * Applies `min_match` only when `profile` is provided (skills or headline/summary).
 * Excludes `payment_requested` rows when that flag is present (Prompt 6).
 */
export async function findAlertMatches(
  alert: Pick<JobAlert, "query" | "min_match">,
  profile: ProfileMatchInput | null,
  since: Date,
  fetchCatalog: AlertCatalogFetch,
): Promise<AlertMatchJob[]> {
  const filters = filtersFromAlertQuery(alert.query);
  const rows = await fetchCatalog(filters, since);
  const hasProfile = Boolean(
    profile &&
      (profile.skills.some((s) => s.trim().length > 0) ||
        (profile.headline && profile.headline.trim()) ||
        (profile.summary && profile.summary.trim())),
  );
  const matchProfile: ProfileMatchInput = profile ?? { skills: [] };
  const minMatch = Math.max(0, Math.min(100, alert.min_match));

  const scored: AlertMatchJob[] = [];
  for (const row of rows) {
    if (isPaymentRequestedJob(row)) continue;
    if (!postedSince(row, since)) continue;
    const result = scoreJobRow(row, matchProfile);
    if (hasProfile && result.matchPercent < minMatch) continue;
    scored.push({
      id: row.external_id || String(row.id),
      title: row.title || "Role",
      company: row.company || "Company",
      location: row.location || "Location TBD",
      applyUrl: row.apply_url || "",
      postedAtIso: row.posted_at,
      matchPercent: result.matchPercent,
      matchedSkills: result.matchedSkills,
      source: row.source || "other",
    });
  }

  scored.sort(
    (a, b) =>
      b.matchPercent - a.matchPercent ||
      (b.postedAtIso ?? "").localeCompare(a.postedAtIso ?? ""),
  );
  return scored.slice(0, ALERT_MATCH_LIMIT);
}
