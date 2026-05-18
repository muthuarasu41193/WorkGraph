import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { CommunityJobClassification, JobCardKind, JobFeedSource, RecommendedJobCard } from "../../../lib/job-dashboard";
import { DEMO_COMMUNITY_POSTS } from "../../../lib/job-dashboard";

export const dynamic = "force-dynamic";

type CommunityRow = {
  id: number;
  external_id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  apply_url: string | null;
  posted_at: string | null;
  source: string;
  kind: string | null;
  classification: string | null;
  is_community: boolean | null;
};

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
  const value = raw.toLowerCase().trim();
  if (
    value === "remoteok" ||
    value === "reddit" ||
    value === "hackernews" ||
    value === "jobicy" ||
    value === "arbeitnow"
  ) {
    return value;
  }
  return "other";
}

function normalizeKind(raw: string | null): JobCardKind {
  return raw === "post" ? "post" : "listing";
}

function normalizeClassification(raw: string | null): CommunityJobClassification {
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

function rowToCard(row: CommunityRow): RecommendedJobCard {
  return {
    id: row.external_id || String(row.id),
    title: row.title || "Role",
    company: row.company || "Company",
    location: row.location || "Location TBD",
    description: row.description || "",
    source: normalizeSource(row.source),
    matchLabel: row.kind === "post" ? "Community post" : "Community listing",
    postedAgo: formatPostedAgo(row.posted_at),
    postedAtIso: row.posted_at,
    kind: normalizeKind(row.kind),
    classification: normalizeClassification(row.classification),
    isCommunity: Boolean(row.is_community),
    matchedSkills: [],
    applyUrl: row.apply_url,
  };
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({ ok: true, jobs: DEMO_COMMUNITY_POSTS, source: "demo_env_missing" });
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });

  const { data, error } = await supabase
    .from("jobs")
    .select("id, external_id, title, company, location, description, apply_url, posted_at, source, kind, classification, is_community")
    .eq("is_community", true)
    .order("posted_at", { ascending: false })
    .limit(8);

  if (error || !data) {
    return NextResponse.json({
      ok: true,
      jobs: DEMO_COMMUNITY_POSTS,
      source: "demo_query_failed",
      error: error?.message ?? null,
    });
  }

  const jobs = (data as CommunityRow[])
    .map(rowToCard)
    .filter((job) => job.source !== "other");

  return NextResponse.json({
    ok: true,
    jobs: jobs.length > 0 ? jobs : DEMO_COMMUNITY_POSTS,
    source: jobs.length > 0 ? "live" : "demo_empty",
  });
}
