/**
 * Profile dashboard job feed + pipeline counts from Supabase.
 *
 * Requires migrations `20260202120000_jobs_board`, `20260204120000_jobs_anon_select`,
 * and `20260205153000_jobs_api_grants` (PostgREST needs GRANT SELECT, not only RLS).
 * Python job_aggregator should target the same DATABASE_URL / Postgres instance.
 */

import { unstable_noStore as noStore } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

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
  | "hackernews"
  | "jobicy"
  | "arbeitnow"
  | "rss"
  | "indeed"
  | "glassdoor"
  | "levels"
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
  listingsBySource: Partial<Record<JobFeedSource, number>>;
  recommended: RecommendedJobCard[];
  communityPosts: RecommendedJobCard[];
  feedKind: "live" | "demo";
  /** Present only in demo mode — drives the troubleshooting banner on the profile. */
  feedDemoHint?: FeedDemoHint | null;
};

type JobRow = {
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

const ATS_SOURCES = [
  "greenhouse",
  "lever",
  "adzuna",
  "workday",
  "smartrecruiters",
  "ashby",
  "jobvite",
  "bamboohr",
  "icims",
  "taleo",
] as const satisfies readonly JobFeedSource[];

const COMMUNITY_SOURCES = [
  "remoteok",
  "reddit",
  "rss",
  "hackernews",
  "jobicy",
  "arbeitnow",
] as const satisfies readonly JobFeedSource[];

function isCommunitySource(source: JobFeedSource): source is (typeof COMMUNITY_SOURCES)[number] {
  return (COMMUNITY_SOURCES as readonly string[]).includes(source);
}

export const DEMO_RECOMMENDED_JOBS: RecommendedJobCard[] = [
  {
    id: "demo-1",
    title: "Senior Frontend Engineer",
    company: "Northwind Labs",
    location: "Remote · US",
    description: "Demo listing shown until live ATS ingest populates the shared jobs table.",
    source: "linkedin",
    matchLabel: "Demo listing — ingest ATS jobs to replace",
    postedAgo: "Demo",
    postedAtIso: null,
    kind: "listing",
    classification: "employer_hiring",
    isCommunity: false,
    matchedSkills: [],
    applyUrl: null,
  },
  {
    id: "demo-2",
    title: "Staff Product Engineer",
    company: "Atlas AI",
    location: "Hybrid · NYC",
    description: "Run the ATS ingest against Supabase to replace these placeholders with live rows.",
    source: "levels",
    matchLabel: "Run job_aggregator ingest against Supabase Postgres",
    postedAgo: "Demo",
    postedAtIso: null,
    kind: "listing",
    classification: "employer_hiring",
    isCommunity: false,
    matchedSkills: [],
    applyUrl: null,
  },
  {
    id: "demo-3",
    title: "Full Stack (TypeScript)",
    company: "Cobalt Health",
    location: "Remote",
    description: "WorkGraph will rank real jobs here after the Postgres jobs table has been filled.",
    source: "reddit",
    matchLabel: "Uses DATABASE_URL pointing at this Supabase DB",
    postedAgo: "Demo",
    postedAtIso: null,
    kind: "listing",
    classification: "employer_hiring",
    isCommunity: false,
    matchedSkills: [],
    applyUrl: null,
  },
  {
    id: "demo-4",
    title: "Founding Frontend Engineer",
    company: "Signal Foundry",
    location: "Remote",
    description: "Community-sourced post preview for the X hiring lane on the profile dashboard.",
    source: "x",
    matchLabel: "Track fast-moving hiring posts from X alongside LinkedIn and Reddit",
    postedAgo: "Demo",
    postedAtIso: null,
    kind: "listing",
    classification: "employer_hiring",
    isCommunity: false,
    matchedSkills: [],
    applyUrl: null,
  },
];

export const DEMO_COMMUNITY_POSTS: RecommendedJobCard[] = [
  {
    id: "community-remoteok-demo",
    title: "Senior Frontend Engineer",
    company: "RemoteOK spotlight",
    location: "Remote",
    description: "Live remote listings from RemoteOK will appear here once the community sync cron starts writing rows.",
    source: "remoteok",
    matchLabel: "Community listing",
    postedAgo: "Demo",
    postedAtIso: null,
    kind: "listing",
    classification: "remote",
    isCommunity: true,
    matchedSkills: [],
    applyUrl: "https://remoteok.com/",
  },
  {
    id: "community-arbeitnow-demo",
    title: "Backend Engineer with visa support",
    company: "Arbeitnow spotlight",
    location: "Berlin / Remote",
    description: "Arbeitnow roles are useful for remote-friendly and visa-aware openings across European teams.",
    source: "arbeitnow",
    matchLabel: "Community listing",
    postedAgo: "Demo",
    postedAtIso: null,
    kind: "listing",
    classification: "employer_hiring",
    isCommunity: true,
    matchedSkills: [],
    applyUrl: "https://www.arbeitnow.com/jobs",
  },
  {
    id: "community-reddit-demo",
    title: "Hiring thread for React and TypeScript roles",
    company: "r/forhire",
    location: "Community post",
    description: "Reddit community hiring posts, freelance requests, and candidate posts are classified before they show up here.",
    source: "reddit",
    matchLabel: "Community post",
    postedAgo: "Demo",
    postedAtIso: null,
    kind: "post",
    classification: "employer_hiring",
    isCommunity: true,
    matchedSkills: [],
    applyUrl: "https://www.reddit.com/r/forhire/",
  },
  {
    id: "community-hn-demo",
    title: "Ask HN: Who is hiring?",
    company: "Hacker News",
    location: "Internet",
    description: "Official Hacker News hiring threads and nearby hiring-related posts will appear here with low-priority discussion badges when needed.",
    source: "hackernews",
    matchLabel: "Community post",
    postedAgo: "Demo",
    postedAtIso: null,
    kind: "post",
    classification: "discussion_only",
    isCommunity: true,
    matchedSkills: [],
    applyUrl: "https://news.ycombinator.com/",
  },
];

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
    s === "ashby" ||
    s === "workday" ||
    s === "smartrecruiters" ||
    s === "jobvite" ||
    s === "bamboohr" ||
    s === "icims" ||
    s === "taleo" ||
    s === "remoteok" ||
    s === "hackernews" ||
    s === "jobicy" ||
    s === "arbeitnow"
  ) {
    return s;
  }
  if (s === "linkedin" || s === "reddit" || s === "x" || s === "twitter" || s === "indeed" || s === "glassdoor" || s === "levels") {
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

function rankJobs(rows: JobRow[], skills: string[], headline: string | null, limit: number): JobRow[] {
  const needles = skills.map((s) => s.trim().toLowerCase()).filter(Boolean);
  const headTerms =
    headline
      ?.toLowerCase()
      .split(/\W+/u)
      .filter((w) => w.length > 3) ?? [];

  const scored = rows.map((row) => {
    const hay = `${row.title} ${row.company} ${row.description}`.toLowerCase();
    let score = 0;
    for (const sk of needles) {
      if (hay.includes(sk)) score += 3;
    }
    for (const t of headTerms) {
      if (hay.includes(t)) score += 1;
    }
    const ts = row.posted_at ? new Date(row.posted_at).getTime() : 0;
    if (!Number.isNaN(ts)) score += Math.min(ts / 1e13, 2);
    return { row, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.row);
}

function rowToCard(row: JobRow, skills: string[]): RecommendedJobCard {
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

  const bySource: Partial<Record<JobFeedSource, number>> = {};

  await Promise.all(
    ATS_SOURCES.map(async (src) => {
      const r = await supabase.from("jobs").select("*", { count: "exact", head: true }).eq("source", src).eq("is_community", false);
      if (!r.error && typeof r.count === "number") {
        bySource[src] = r.count;
      }
    })
  );

  return { ok: true, total: totalRes.count ?? 0, bySource };
}

async function fetchJobRows(supabase: SupabaseClient): Promise<JobRow[] | null> {
  const { data, error } = await supabase
    .from("jobs")
    .select("id, external_id, title, company, location, description, apply_url, posted_at, source, kind, classification, is_community")
    .eq("is_community", false)
    .order("posted_at", { ascending: false })
    .limit(250);

  if (error) {
    console.warn("[job-dashboard] jobs select error:", error.message, error.code);
    return null;
  }
  if (!data) return null;
  return data as JobRow[];
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

/**
 * Loads pipeline totals, global listing counts, and ranked recommendations for the signed-in profile.
 */
export async function loadProfileJobDashboard(
  supabase: SupabaseClient,
  userId: string,
  profile: { skills: string[]; headline: string | null }
): Promise<ProfileJobsPayload> {
  noStore();
  const pipeline = await fetchPipelineCounts(supabase, userId);
  const stats = await fetchListingStats(supabase);

  if (!stats.ok) {
    const communityRows = await fetchCommunityRows(supabase);
    const communityPosts =
      communityRows && communityRows.length > 0 ? communityRows.map((row) => rowToCard(row, [])) : DEMO_COMMUNITY_POSTS;
    return {
      pipeline,
      liveListings: 0,
      listingsBySource: {},
      recommended: DEMO_RECOMMENDED_JOBS,
      communityPosts,
      feedKind: "demo",
      feedDemoHint: "count_unavailable",
    };
  }

  if (stats.total > 0) {
    const [communityRows, atsRows] = await Promise.all([fetchCommunityRows(supabase), fetchJobRows(supabase)]);
    const communityPosts =
      communityRows && communityRows.length > 0 ? communityRows.map((row) => rowToCard(row, [])) : DEMO_COMMUNITY_POSTS;

    if (!atsRows) {
      return {
        pipeline,
        liveListings: stats.total,
        listingsBySource: stats.bySource,
        recommended: DEMO_RECOMMENDED_JOBS,
        communityPosts,
        feedKind: "demo",
        feedDemoHint: "rows_unavailable",
      };
    }

    if (atsRows.length === 0) {
      return {
        pipeline,
        liveListings: stats.total,
        listingsBySource: stats.bySource,
        recommended: DEMO_RECOMMENDED_JOBS,
        communityPosts,
        feedKind: "demo",
        feedDemoHint: "select_returned_empty",
      };
    }

    const ranked = rankJobs(atsRows, profile.skills, profile.headline, 250);
    const recommended =
      ranked.length > 0 ? ranked.map((r) => rowToCard(r, profile.skills)) : DEMO_RECOMMENDED_JOBS;

    return {
      pipeline,
      liveListings: stats.total,
      listingsBySource: stats.bySource,
      recommended,
      communityPosts,
      feedKind: ranked.length > 0 ? "live" : "demo",
      feedDemoHint: ranked.length > 0 ? null : "select_returned_empty",
    };
  }

  // No ATS rows: use community-synced jobs for both spotlight cards and ranked recommendations when available.
  const communityForRank = await fetchCommunityRowsForRanking(supabase);
  const communityPosts =
    communityForRank && communityForRank.length > 0
      ? communityForRank.slice(0, 24).map((row) => rowToCard(row, []))
      : DEMO_COMMUNITY_POSTS;

  if (!communityForRank || communityForRank.length === 0) {
    return {
      pipeline,
      liveListings: 0,
      listingsBySource: stats.bySource,
      recommended: DEMO_RECOMMENDED_JOBS,
      communityPosts,
      feedKind: "demo",
      feedDemoHint: "empty_table",
    };
  }

  const ranked = rankJobs(communityForRank, profile.skills, profile.headline, 250);
  const recommended =
    ranked.length > 0 ? ranked.map((r) => rowToCard(r, profile.skills)) : DEMO_RECOMMENDED_JOBS;
  const listingsBySource = countBySourceFromJobRows(communityForRank);

  return {
    pipeline,
    liveListings: communityForRank.length,
    listingsBySource,
    recommended,
    communityPosts,
    feedKind: ranked.length > 0 ? "live" : "demo",
    feedDemoHint: ranked.length > 0 ? null : "select_returned_empty",
  };
}

