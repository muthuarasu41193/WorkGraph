import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { loadLiveJobCards } from "../../../lib/jobs-catalog";
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
 * Full live job catalog for the profile Jobs tab (paginated server-side fetch from Postgres).
 * GET /api/jobs?skills=react,typescript
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skills = parseSkillsParam(searchParams.get("skills"));

  const supabase = createServerSupabaseClient(await cookies());
  const { jobs, total } = await loadLiveJobCards(supabase, skills);

  if (jobs === null) {
    return NextResponse.json(
      {
        ok: false,
        jobs: [],
        total: 0,
        loaded: 0,
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
    loaded: jobs.length,
    source: "live",
  });
}