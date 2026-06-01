import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { JobsCatalogFilters } from "../../../lib/jobs-catalog";
import { loadLiveJobCardsPage } from "../../../lib/jobs-catalog";
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
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("page_size") || "100") || 100));
  const filters = parseCatalogFilters(searchParams);

  const supabase = createServerSupabaseClient(await cookies());
  const { jobs, total, hasMore, filtered } = await loadLiveJobCardsPage(supabase, profileSkills, {
    page,
    pageSize,
    filters,
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
    loaded: jobs.length,
    source: "live",
  });
}
