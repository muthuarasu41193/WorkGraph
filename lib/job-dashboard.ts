/**
 * Profile dashboard job feed + pipeline counts from Supabase.
 *
 * Requires migrations `20260202120000_jobs_board`, `20260204120000_jobs_anon_select`,
 * and `20260205153000_jobs_api_grants` (PostgREST needs GRANT SELECT, not only RLS).
 * Python job_aggregator should target the same DATABASE_URL / Postgres instance.
 */

import { unstable_noStore as noStore } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchLiveJobsCatalog, mapJobRowToCard } from "./jobs-catalog";
import { rankJobRows, scoreJobRow, type ProfileMatchInput } from "./job-match";
import {
  fetchLiveHiringSignalJobCards,
  mergeHiringSignalJobCards,
} from "./employer/hiring-signal-jobs";

export { fetchLiveJobsCatalog, LIVE_JOBS_FETCH_PAGE_SIZE, mapJobRowToCard } from "./jobs-catalog";

/** Matches dashboard cards + optional DB rows in job_tracker_entries.status */
export type JobPipelineCounts = {
  applied: number;
  interview: number;
  offers: number;
  saved: number;
};

/** Sources shown on recommended cards — ATS ingestors plus legacy demo placeholders */
export type JobFeedSource =
  | "greenhouse"
  | "lever"
  | "adzuna"
  | "usajobs"
  | "workday"
  | "smartrecruiters"
  | "ashby"
  | "jobvite"
  | "bamboohr"
  | "icims"
  | "taleo"
  | "linkedin"
  | "reddit"
  | "x"
  | "remoteok"
  | "remotejobs"
  | "hackernews"
  | "jobicy"
  | "arbeitnow"
  | "rss"
  | "indeed"
  | "glassdoor"
  | "levels"
  | "facebook"
  | "workgraph"
  | "other";

export type JobCardKind = "listing" | "post";

export type CommunityJobClassification =
  | "employer_hiring"
  | "candidate_for_hire"
  | "freelance"
  | "internship"
  | "remote"
  | "discussion_only";

export type RecommendedJobCard = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  source: JobFeedSource;
  matchLabel: string;
  postedAgo: string;
  /** ISO timestamp for client-side date filters; null when unknown */
  postedAtIso: string | null;
  kind: JobCardKind;
  classification: CommunityJobClassification;
  isCommunity: boolean;
  /** Profile skills that appear in title/description (lowercase for stable keys) */
  matchedSkills: string[];
  /** Official apply URL when row comes from ATS ingest */
  applyUrl?: string | null;
};

/** Why the profile shows placeholder cards instead of Postgres rows (only set when feedKind is demo). */
export type FeedDemoHint =
  | "empty_table"
  | "count_unavailable"
  | "rows_unavailable"
  | "select_returned_empty";

export type ProfileJobsPayload = {
  pipeline: JobPipelineCounts;
  liveListings: number;
  /** Jobs that overlap the user's profile skills (score ≥ 8). */
  matchedListings: number;
  listingsBySource: Partial<Record<JobFeedSource, number>>;
  recommended: RecommendedJobCard[];
  communityPosts: RecommendedJobCard[];
  feedKind: "live" | "demo";
  /** Present when live listings exist but rows could not be loaded. */
  feedDemoHint?: FeedDemoHint | null;
};

export type JobRow = {
  id: number;
  external_id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  apply_url: string;
  posted_at: string | null;
  source: string;
  kind: string | null;
  classification: string | null;
  is_community: boolean | null;
};

const JOB_SELECT_COLUMNS =
  "id, external_id, title, company, location, description, apply_url, posted_at, source, kind, classification, is_community";

const ATS_SOURCES = [
  "greenhouse",
  "lever",
  "adzuna",
  "usajobs",
  "workday",
  "smartrecruiters",
  "ashby",
  "jobvite",
  "bamboohr",
  "icims",
  "taleo",
] as const satisfies readonly JobFeedSource[];

/** Job boards synced via public APIs — shown on the Jobs tab as live listings. */
const JOB_BOARD_SOURCES = [
  "remoteok",
  "remotejobs",
  "jobicy",
  "arbeitnow",
] as const satisfies readonly JobFeedSource[];

const LIVE_LISTING_SOURCES = [...ATS_SOURCES, ...JOB_BOARD_SOURCES] as const satisfies readonly JobFeedSource[];

const COMMUNITY_SOURCES = [
  "reddit",
  "rss",
  "hackernews",
] as const satisfies readonly JobFeedSource[];

function isCommunitySource(source: JobFeedSource): source is (typeof COMMUNITY_SOURCES)[number] {
  return (COMMUNITY_SOURCES as readonly string[]).includes(source);
}

const PROFILE_MATCH_MIN_SCORE = 8;

/** Count jobs whose title/description overlap the user's profile skills. */
export function countProfileMatchedJobs(rows: JobRow[], profile: ProfileMatchInput): number {
  const hasSkills = profile.skills.some((s) => s.trim().length > 0);
  if (!hasSkills || rows.length === 0) return 0;
  return rows.filter((row) => {
    const scored = scoreJobRow(row, profile);
    return scored.matchedSkills.length > 0 || scored.score >= PROFILE_MATCH_MIN_SCORE;
  }).length;
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

function rowToCard(row: JobRow, profile: ProfileMatchInput): RecommendedJobCard {
  return mapJobRowToCard(row, profile.skills, profile);
}

async function fetchPipelineCounts(supabase: SupabaseClient, userId: string): Promise<JobPipelineCounts> {
  const empty: JobPipelineCounts = { applied: 0, interview: 0, offers: 0, saved: 0 };
  const { data, error } = await supabase.from("job_tracker_entries").select("status").eq("user_id", userId);

  if (error || !data) return empty;

  const counts = { ...empty };
  for (const row of data) {
    const st = typeof row.status === "string" ? row.status : "";
    if (st === "applied") counts.applied += 1;
    else if (st === "interview") counts.interview += 1;
    else if (st === "offers") counts.offers += 1;
    else if (st === "saved") counts.saved += 1;
  }
  return counts;
}

async function fetchListingStats(
  supabase: SupabaseClient
): Promise<
  | { ok: true; total: number; bySource: Partial<Record<JobFeedSource, number>> }
  | { ok: false; error: string; code?: string }
> {
  const totalRes = await supabase.from("jobs").select("*", { count: "exact", head: true }).eq("is_community", false);
  if (totalRes.error) {
    console.warn("[job-dashboard] jobs count error:", totalRes.error.message, totalRes.error.code);
    return { ok: false, error: totalRes.error.message, code: totalRes.error.code };
  }

  return { ok: true, total: totalRes.count ?? 0, bySource: {} };
}

async function fetchJobRows(supabase: SupabaseClient): Promise<JobRow[] | null> {
  const { rows } = await fetchLiveJobsCatalog(supabase, { maxRows: 5000 });
  return rows;
}

async function fetchCommunityRows(supabase: SupabaseClient): Promise<JobRow[] | null> {
  const { data, error } = await supabase
    .from("jobs")
    .select("id, external_id, title, company, location, description, apply_url, posted_at, source, kind, classification, is_community")
    .eq("is_community", true)
    .order("posted_at", { ascending: false })
    .limit(24);

  if (error) {
    console.warn("[job-dashboard] community jobs select error:", error.message, error.code);
    return null;
  }
  if (!data) return null;
  return (data as JobRow[]).filter((row) => isCommunitySource(normalizeSource(row.source)));
}

/** Broader fetch for ranking when ATS table is empty but community sync has populated rows. */
async function fetchCommunityRowsForRanking(supabase: SupabaseClient): Promise<JobRow[] | null> {
  const { data, error } = await supabase
    .from("jobs")
    .select("id, external_id, title, company, location, description, apply_url, posted_at, source, kind, classification, is_community")
    .eq("is_community", true)
    .order("posted_at", { ascending: false })
    .limit(250);

  if (error) {
    console.warn("[job-dashboard] community jobs (ranking) select error:", error.message, error.code);
    return null;
  }
  if (!data) return null;
  return (data as JobRow[]).filter((row) => isCommunitySource(normalizeSource(row.source)));
}

function countBySourceFromJobRows(rows: JobRow[]): Partial<Record<JobFeedSource, number>> {
  const bySource: Partial<Record<JobFeedSource, number>> = {};
  for (const row of rows) {
    const src = normalizeSource(row.source);
    if (src === "other") continue;
    bySource[src] = (bySource[src] ?? 0) + 1;
  }
  return bySource;
}

/** Prefer ranked matches; fall back to newest live rows so the Jobs tab never shows demo placeholders when Postgres has data. */
function recommendedFromJobRows(
  rows: JobRow[],
  profile: ProfileMatchInput,
  limit = 150,
): RecommendedJobCard[] {
  const ranked = rankJobRows(rows, profile, { limit });
  if (ranked.length > 0) {
    return ranked.map((r) => rowToCard(r, profile));
  }
  return rows.slice(0, Math.min(limit, 50)).map((r) => rowToCard(r, profile));
}

async function withHiringSignalsInFeed(
  supabase: SupabaseClient,
  profile: ProfileMatchInput,
  payload: ProfileJobsPayload,
): Promise<ProfileJobsPayload> {
  const signals = await fetchLiveHiringSignalJobCards(supabase, profile);
  if (signals.length === 0) return payload;
  const recommended = mergeHiringSignalJobCards(payload.recommended, signals, profile);
  const hasOnlyDemo =
    payload.recommended.length === 0 &&
    payload.liveListings === 0;
  const hasLiveCatalog = payload.liveListings > 0;
  return {
    ...payload,
    recommended,
    liveListings: payload.liveListings + signals.length,
    feedKind: hasOnlyDemo || payload.feedKind === "live" || hasLiveCatalog ? "live" : payload.feedKind,
    feedDemoHint: hasOnlyDemo || hasLiveCatalog ? null : payload.feedDemoHint,
  };
}

/**
 * Loads pipeline totals, global listing counts, and ranked recommendations for the signed-in profile.
 */
async function loadProfileJobDashboardCore(
  supabase: SupabaseClient,
  userId: string,
  profile: { skills: string[]; headline: string | null; summary?: string | null }
): Promise<ProfileJobsPayload> {
  const matchProfile: ProfileMatchInput = {
    skills: profile.skills,
    headline: profile.headline,
    summary: profile.summary ?? null,
  };
  noStore();
  const pipeline = await fetchPipelineCounts(supabase, userId);
  const stats = await fetchListingStats(supabase);

  if (!stats.ok) {
    const communityRows = await fetchCommunityRows(supabase);
    const communityPosts =
      communityRows && communityRows.length > 0
        ? communityRows.map((row) => rowToCard(row, { skills: [], headline: null, summary: null }))
        : [];
    return {
      pipeline,
      liveListings: 0,
      matchedListings: 0,
      listingsBySource: {},
      recommended: [],
      communityPosts,
      feedKind: "live",
      feedDemoHint: "count_unavailable",
    };
  }

  if (stats.total > 0) {
    const [communityRows, atsRows] = await Promise.all([fetchCommunityRows(supabase), fetchJobRows(supabase)]);
    const communityPosts =
      communityRows && communityRows.length > 0
        ? communityRows.map((row) => rowToCard(row, { skills: [], headline: null, summary: null }))
        : [];

    if (!atsRows) {
      return {
        pipeline,
        liveListings: stats.total,
        matchedListings: 0,
        listingsBySource: stats.bySource,
        recommended: [],
        communityPosts,
        feedKind: "live",
        feedDemoHint: "rows_unavailable",
      };
    }

    if (atsRows.length === 0) {
      return {
        pipeline,
        liveListings: stats.total,
        matchedListings: 0,
        listingsBySource: stats.bySource,
        recommended: [],
        communityPosts,
        feedKind: "live",
        feedDemoHint: "select_returned_empty",
      };
    }

    const listingsBySource = countBySourceFromJobRows(atsRows);
    const recommended = recommendedFromJobRows(atsRows, matchProfile);
    const matchedListings = countProfileMatchedJobs(atsRows, matchProfile);

    return {
      pipeline,
      liveListings: stats.total,
      matchedListings,
      listingsBySource,
      recommended,
      communityPosts,
      feedKind: "live",
      feedDemoHint: null,
    };
  }

  // No ATS rows: use community-synced jobs for ranked recommendations when available.
  const communityForRank = await fetchCommunityRowsForRanking(supabase);
  const communityPosts =
    communityForRank && communityForRank.length > 0
      ? communityForRank.slice(0, 24).map((row) => rowToCard(row, { skills: [], headline: null, summary: null }))
      : [];

  if (!communityForRank || communityForRank.length === 0) {
    return {
      pipeline,
      liveListings: 0,
      matchedListings: 0,
      listingsBySource: stats.bySource,
      recommended: [],
      communityPosts,
      feedKind: "live",
      feedDemoHint: "empty_table",
    };
  }

  const ranked = rankJobRows(communityForRank, matchProfile, { limit: 250 });
  const recommended =
    ranked.length > 0 ? ranked.map((r) => rowToCard(r, matchProfile)) : [];
  const listingsBySource = countBySourceFromJobRows(communityForRank);
  const matchedListings = countProfileMatchedJobs(communityForRank, matchProfile);

  return {
    pipeline,
    liveListings: communityForRank.length,
    matchedListings,
    listingsBySource,
    recommended,
    communityPosts,
    feedKind: "live",
    feedDemoHint: ranked.length > 0 ? null : "select_returned_empty",
  };
}

export async function loadProfileJobDashboard(
  supabase: SupabaseClient,
  userId: string,
  profile: { skills: string[]; headline: string | null; summary?: string | null },
): Promise<ProfileJobsPayload> {
  const matchProfile: ProfileMatchInput = {
    skills: profile.skills,
    headline: profile.headline,
    summary: profile.summary ?? null,
  };
  const payload = await loadProfileJobDashboardCore(supabase, userId, profile);
  return withHiringSignalsInFeed(supabase, matchProfile, payload);
}

