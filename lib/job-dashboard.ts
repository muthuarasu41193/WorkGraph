/**
 * Profile dashboard job feed + pipeline counts from Supabase.
 *
 * Requires migration `supabase/migrations/20260202120000_jobs_board.sql`.
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
  | "ashby"
  | "linkedin"
  | "reddit"
  | "indeed"
  | "glassdoor"
  | "levels";

export type RecommendedJobCard = {
  id: string;
  title: string;
  company: string;
  location: string;
  source: JobFeedSource;
  matchLabel: string;
  postedAgo: string;
  /** Official apply URL when row comes from ATS ingest */
  applyUrl?: string | null;
};

export type ProfileJobsPayload = {
  pipeline: JobPipelineCounts;
  liveListings: number;
  listingsBySource: Partial<Record<JobFeedSource, number>>;
  recommended: RecommendedJobCard[];
  feedKind: "live" | "demo";
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
};

export const DEMO_RECOMMENDED_JOBS: RecommendedJobCard[] = [
  {
    id: "demo-1",
    title: "Senior Frontend Engineer",
    company: "Northwind Labs",
    location: "Remote · US",
    source: "linkedin",
    matchLabel: "Demo listing — ingest ATS jobs to replace",
    postedAgo: "Demo",
    applyUrl: null,
  },
  {
    id: "demo-2",
    title: "Staff Product Engineer",
    company: "Atlas AI",
    location: "Hybrid · NYC",
    source: "levels",
    matchLabel: "Run job_aggregator ingest against Supabase Postgres",
    postedAgo: "Demo",
    applyUrl: null,
  },
  {
    id: "demo-3",
    title: "Full Stack (TypeScript)",
    company: "Cobalt Health",
    location: "Remote",
    source: "reddit",
    matchLabel: "Uses DATABASE_URL pointing at this Supabase DB",
    postedAgo: "Demo",
    applyUrl: null,
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
  if (s === "greenhouse" || s === "lever" || s === "ashby") return s;
  return "indeed";
}

function buildMatchLabel(row: JobRow, skills: string[]): string {
  const hay = `${row.title}\n${row.description}`.toLowerCase();
  const hits = skills
    .map((sk) => sk.trim())
    .filter(Boolean)
    .filter((sk) => hay.includes(sk.toLowerCase()));
  if (hits.length > 0) {
    const shown = hits.slice(0, 4);
    return `Skill overlap: ${shown.join(", ")}${hits.length > 4 ? "…" : ""}`;
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
    source: normalizeSource(row.source),
    matchLabel: buildMatchLabel(row, skills),
    postedAgo: formatPostedAgo(row.posted_at),
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

async function fetchListingStats(supabase: SupabaseClient): Promise<{
  total: number;
  bySource: Partial<Record<JobFeedSource, number>>;
} | null> {
  const totalRes = await supabase.from("jobs").select("*", { count: "exact", head: true });
  if (totalRes.error) {
    console.warn("[job-dashboard] jobs count error:", totalRes.error.message, totalRes.error.code);
    return null;
  }

  const bySource: Partial<Record<JobFeedSource, number>> = {};
  const sources = ["greenhouse", "lever", "ashby"] as const;
  await Promise.all(
    sources.map(async (src) => {
      const r = await supabase.from("jobs").select("*", { count: "exact", head: true }).eq("source", src);
      if (!r.error && typeof r.count === "number") {
        bySource[src] = r.count;
      }
    })
  );

  return { total: totalRes.count ?? 0, bySource };
}

async function fetchJobRows(supabase: SupabaseClient): Promise<JobRow[] | null> {
  const { data, error } = await supabase
    .from("jobs")
    .select("id, external_id, title, company, location, description, apply_url, posted_at, source")
    .order("posted_at", { ascending: false })
    .limit(250);

  if (error) {
    console.warn("[job-dashboard] jobs select error:", error.message, error.code);
    return null;
  }
  if (!data) return null;
  return data as JobRow[];
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
  if (!stats || stats.total === 0) {
    return {
      pipeline,
      liveListings: stats?.total ?? 0,
      listingsBySource: stats?.bySource ?? {},
      recommended: DEMO_RECOMMENDED_JOBS,
      feedKind: "demo",
    };
  }

  const rows = await fetchJobRows(supabase);
  if (!rows || rows.length === 0) {
    return {
      pipeline,
      liveListings: stats.total,
      listingsBySource: stats.bySource,
      recommended: DEMO_RECOMMENDED_JOBS,
      feedKind: "demo",
    };
  }

  const ranked = rankJobs(rows, profile.skills, profile.headline, 15);
  const recommended =
    ranked.length > 0 ? ranked.map((r) => rowToCard(r, profile.skills)) : DEMO_RECOMMENDED_JOBS;

  return {
    pipeline,
    liveListings: stats.total,
    listingsBySource: stats.bySource,
    recommended,
    feedKind: ranked.length > 0 ? "live" : "demo",
  };
}
