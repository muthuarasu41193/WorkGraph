import { NextResponse } from "next/server";
import { getSupabaseSessionUser } from "@/lib/route-auth";
import {
  getResumeIntelligenceReport,
  deleteResumeIntelligenceReport,
} from "@/lib/talent-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/talent-intelligence/reports/[id]
 * Returns a single Resume Intelligence report.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { data: authData, error: authError } = await getSupabaseSessionUser(request);
    if (authError || !authData.user) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;
    const report = await getResumeIntelligenceReport(authData.user.id, id);

    if (!report) {
      return NextResponse.json({ ok: false, error: "Report not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      report: {
        id: report.id,
        jobTitle: report.job_title,
        company: report.company,
        jobId: report.job_id,
        overallScore: report.overall_score,
        status: report.status,
        createdAt: report.created_at,
        data: report.report,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch report.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/talent-intelligence/reports/[id]
 * Deletes a report (privacy: user controls their data).
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { data: authData, error: authError } = await getSupabaseSessionUser(request);
    if (authError || !authData.user) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;
    await deleteResumeIntelligenceReport(authData.user.id, id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete report.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
