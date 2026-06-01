import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { loadLiveJobCardsPage } from "../../../lib/jobs-catalog";
import { createServerSupabaseClient } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

function parseSkillsParam(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Paginated live jobs for the profile Jobs tab.
 * GET /api/jobs?page=1&page_size=100&skills=react
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skills = parseSkillsParam(searchParams.get("skills"));
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("page_size") || "100") || 100));

  const supabase = createServerSupabaseClient(await cookies());
  const { jobs, total, hasMore } = await loadLiveJobCardsPage(supabase, skills, { page, pageSize });

  if (jobs === null) {
    return NextResponse.json(
      {
        ok: false,
        jobs: [],
        total: 0,
        page,
        page_size: pageSize,
        has_more: false,
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
    loaded: jobs.length,
    source: "live",
  });
}
