import { NextResponse } from "next/server";
import { getSupabaseSessionUser } from "@/lib/route-auth";
import { listResumeIntelligenceReports } from "@/lib/talent-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/talent-intelligence/reports
 * Lists the authenticated user's Resume Intelligence report history.
 */
export async function GET(request: Request) {
  try {
    const { data: authData, error: authError } = await getSupabaseSessionUser(request);
    if (authError || !authData.user) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));

    const reports = await listResumeIntelligenceReports(authData.user.id, limit);

    return NextResponse.json({
      ok: true,
      reports: reports.map((r) => ({
        id: r.id,
        jobTitle: r.job_title,
        company: r.company,
        jobId: r.job_id,
        overallScore: r.overall_score,
        status: r.status,
        createdAt: r.created_at,
        cached: true,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list reports.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
