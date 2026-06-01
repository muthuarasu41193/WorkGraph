import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { JobsCatalogFilters } from "../../../lib/jobs-catalog";
import { LIVE_JOBS_CLIENT_FILTER_CAP, LIVE_JOBS_MAX_API_PAGE_SIZE, loadLiveJobCardsPage } from "../../../lib/jobs-catalog";
import { createServerSupabaseClient } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

function parseListParam(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseCatalogFilters(searchParams: URLSearchParams): JobsCatalogFilters {
  const date = searchParams.get("date");
  const locMode = searchParams.get("locMode");
  return {
    q: searchParams.get("q")?.trim() || undefined,
    sources: parseListParam(searchParams.get("src")),
    dateWindow:
      date === "1" || date === "7" || date === "30" ? date : date === "any" ? "any" : undefined,
    locationMode:
      locMode === "remote" || locMode === "hybrid" || locMode === "onsite" ? locMode : undefined,
    locationQuery: searchParams.get("loc")?.trim() || undefined,
    company: searchParams.get("company")?.trim() || undefined,
    jobTypes: parseListParam(searchParams.get("type")),
  };
}

/**
 * Paginated live jobs for the profile Jobs tab (supports search + filter query params).
 * GET /api/jobs?page=1&page_size=100&q=engineer&src=greenhouse,lever
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileSkills = parseListParam(
    searchParams.get("profile_skills") ?? searchParams.get("skills")
  );
  const profileHeadline = searchParams.get("profile_headline")?.trim() || null;
  const profileSummary = searchParams.get("profile_summary")?.trim()?.slice(0, 2000) || null;
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const rankProfileParam = searchParams.get("rank_profile");
  const rankByProfile = rankProfileParam !== "0" && rankProfileParam !== "false";
  const pageSizeCap = rankByProfile ? LIVE_JOBS_MAX_API_PAGE_SIZE : LIVE_JOBS_CLIENT_FILTER_CAP;
  const pageSize = Math.min(
    pageSizeCap,
    Math.max(1, Number(searchParams.get("page_size") || "100") || 100)
  );
  const filters = parseCatalogFilters(searchParams);

  const supabase = createServerSupabaseClient(await cookies());
  const { jobs, total, hasMore, filtered, ranked } = await loadLiveJobCardsPage(supabase, profileSkills, {
    page,
    pageSize,
    filters,
    rankByProfile,
    profile: {
      skills: profileSkills,
      headline: profileHeadline,
      summary: profileSummary,
    },
  });

  if (jobs === null) {
    return NextResponse.json(
      {
        ok: false,
        jobs: [],
        total: 0,
        page,
        page_size: pageSize,
        has_more: false,
        filtered,
        source: "query_failed",
        error: "Could not load jobs from Supabase",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    jobs,
    total,
    page,
    page_size: pageSize,
    has_more: hasMore,
    filtered,
    ranked: Boolean(ranked),
    loaded: jobs.length,
    source: "live",
  });
}
