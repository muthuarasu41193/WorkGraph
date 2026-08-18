import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { LIVE_JOBS_CLIENT_FILTER_CAP, LIVE_JOBS_MAX_API_PAGE_SIZE, loadLiveJobCardsPage } from "../../../lib/jobs-catalog";
import { createServerSupabaseClient } from "../../../lib/supabase";
import { parseJobSearchQuery } from "../../../lib/validation";

export const dynamic = "force-dynamic";

/**
 * Paginated live jobs for the profile Jobs tab (supports search + filter query params).
 * GET /api/jobs?page=1&page_size=100&q=engineer&src=greenhouse,lever
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = parseJobSearchQuery(searchParams);
  const pageSizeCap = parsed.rankByProfile ? LIVE_JOBS_MAX_API_PAGE_SIZE : LIVE_JOBS_CLIENT_FILTER_CAP;
  const pageSize = Math.min(pageSizeCap, parsed.pageSize);
  const page = parsed.page;

  const supabase = createServerSupabaseClient(await cookies());
  const { jobs, total, hasMore, filtered, ranked } = await loadLiveJobCardsPage(supabase, parsed.profileSkills, {
    page,
    pageSize,
    filters: parsed.filters,
    rankByProfile: parsed.rankByProfile,
    profile: {
      skills: parsed.profileSkills,
      headline: parsed.profileHeadline,
      summary: parsed.profileSummary,
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
