/**
 * Client-safe job catalog helpers (no next/cache). Used by the jobs API route,
 * profile dashboard server loader, and browser-side catalog fetch on the Jobs tab.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CommunityJobClassification,
  JobCardKind,
  JobFeedSource,
  JobRow,
  RecommendedJobCard,
} from "./job-dashboard";

export type { JobRow };

const JOB_SELECT_COLUMNS =
  "id, external_id, title, company, location, description, apply_url, posted_at, source, kind, classification, is_community";

/** PostgREST page size — fetch live listings in batches for the jobs board. */
export const LIVE_JOBS_FETCH_PAGE_SIZE = 1000;

function formatPostedAgo(iso: string | null): string {
  if (!iso) return "Listed recently";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Listed recently";
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

function normalizeSource(raw: string): JobFeedSource {
  const s = raw.toLowerCase().trim();
  if (
    s === "greenhouse" ||
    s === "lever" ||
    s === "adzuna" ||
    s === "usajobs" ||
    s === "ashby" ||
    s === "workday" ||
    s === "smartrecruiters" ||
    s === "jobvite" ||
    s === "bamboohr" ||
    s === "icims" ||
    s === "taleo" ||
    s === "remoteok" ||
    s === "remotejobs" ||
    s === "hackernews" ||
    s === "jobicy" ||
    s === "arbeitnow"
  ) {
    return s;
  }
  if (s === "linkedin" || s === "reddit" || s === "x" || s === "twitter" || s === "indeed" || s === "glassdoor" || s === "levels" || s === "facebook") {
    return s === "twitter" ? "x" : s;
  }
  return "other";
}

function normalizeKind(raw: string | null | undefined): JobCardKind {
  return raw === "post" ? "post" : "listing";
}

function normalizeClassification(raw: string | null | undefined): CommunityJobClassification {
  switch (raw) {
    case "candidate_for_hire":
    case "freelance":
    case "internship":
    case "remote":
    case "discussion_only":
      return raw;
    case "employer_hiring":
    default:
      return "employer_hiring";
  }
}

function classificationLabel(value: CommunityJobClassification): string {
  switch (value) {
    case "candidate_for_hire":
      return "Candidate for hire";
    case "freelance":
      return "Freelance";
    case "internship":
      return "Internship";
    case "remote":
      return "Remote";
    case "discussion_only":
      return "Discussion only";
    case "employer_hiring":
    default:
      return "Employer hiring";
  }
}

function matchedProfileSkills(row: JobRow, skills: string[]): string[] {
  const hay = `${row.title}\n${row.description}`.toLowerCase();
  return skills
    .map((sk) => sk.trim())
    .filter(Boolean)
    .filter((sk) => hay.includes(sk.toLowerCase()));
}

function buildMatchLabel(row: JobRow, skills: string[]): string {
  const hits = matchedProfileSkills(row, skills);
  if (hits.length > 0) {
    const shown = hits.slice(0, 4);
    return `Skill overlap: ${shown.join(", ")}${hits.length > 4 ? "…" : ""}`;
  }
  if (row.is_community) {
    const source = normalizeSource(row.source);
    return `${normalizeKind(row.kind) === "post" ? "Community post" : "Community listing"} · ${classificationLabel(normalizeClassification(row.classification))} · via ${source}`;
  }
  return `${row.company} · via ${row.source} ATS`;
}

export function mapJobRowToCard(row: JobRow, skills: string[] = []): RecommendedJobCard {
  return {
    id: row.external_id || String(row.id),
    title: row.title || "Role",
    company: row.company || "Company",
    location: row.location || "Location TBD",
    description: row.description || "",
    source: normalizeSource(row.source),
    matchLabel: buildMatchLabel(row, skills),
    postedAgo: formatPostedAgo(row.posted_at),
    postedAtIso: row.posted_at,
    kind: normalizeKind(row.kind),
    classification: normalizeClassification(row.classification),
    isCommunity: Boolean(row.is_community),
    matchedSkills: matchedProfileSkills(row, skills),
    applyUrl: row.apply_url,
  };
}

/** Paginate through all live ATS / job-board rows for the jobs page. */
export async function fetchLiveJobsCatalog(
  supabase: SupabaseClient,
  options?: { maxRows?: number }
): Promise<{ rows: JobRow[] | null; total: number }> {
  const maxRows = options?.maxRows ?? 50_000;
  const totalRes = await supabase.from("jobs").select("*", { count: "exact", head: true }).eq("is_community", false);
  if (totalRes.error) {
    console.warn("[jobs-catalog] jobs count error:", totalRes.error.message, totalRes.error.code);
    return { rows: null, total: 0 };
  }

  const total = totalRes.count ?? 0;
  if (total === 0) return { rows: [], total: 0 };

  const all: JobRow[] = [];
  let offset = 0;

  while (offset < total && all.length < maxRows) {
    const batchSize = Math.min(LIVE_JOBS_FETCH_PAGE_SIZE, maxRows - all.length, total - offset);
    const end = offset + batchSize - 1;
    const { data, error } = await supabase
      .from("jobs")
      .select(JOB_SELECT_COLUMNS)
      .eq("is_community", false)
      .order("posted_at", { ascending: false })
      .range(offset, end);

    if (error) {
      console.warn("[jobs-catalog] jobs page select error:", error.message, error.code);
      return { rows: null, total };
    }
    if (!data?.length) break;
    all.push(...(data as JobRow[]));
    offset += data.length;
    if (data.length < batchSize) break;
  }

  return { rows: all, total };
}

export async function loadLiveJobCards(
  supabase: SupabaseClient,
  skills: string[] = [],
  options?: { maxRows?: number }
): Promise<{ jobs: RecommendedJobCard[] | null; total: number }> {
  const { rows, total } = await fetchLiveJobsCatalog(supabase, options);
  if (rows === null) return { jobs: null, total };
  return { jobs: rows.map((row) => mapJobRowToCard(row, skills)), total };
}
