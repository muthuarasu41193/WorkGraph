import { NextResponse } from "next/server";
import { getSupabaseSessionUser } from "@/lib/route-auth";
import { analyzeResumeIntelligence } from "@/lib/talent-intelligence";
import { formatTalentIntelligenceError } from "@/lib/talent-intelligence/errors";
import { truncateText } from "@/lib/talent-intelligence/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MIN_RESUME_CHARS = 120;
const MIN_JD_CHARS = 80;
const MAX_JD_CHARS = 32000;

/**
 * POST /api/talent-intelligence/analyze
 *
 * Compares the authenticated user's resume against a job description.
 * Returns a cached report when resume + JD hash match a prior analysis.
 *
 * Body (JSON):
 * - jobDescription: string (required)
 * - jobId?: string
 * - jobTitle?: string
 * - company?: string
 * - forceRefresh?: boolean
 */
export async function POST(request: Request) {
  try {
    const { data: authData, error: authError } = await getSupabaseSessionUser(request);
    if (authError || !authData.user) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const jobDescription = String(body.jobDescription ?? "").trim();
    const jobId = body.jobId ? String(body.jobId) : null;
    const jobTitle = body.jobTitle ? String(body.jobTitle).trim() : null;
    const company = body.company ? String(body.company).trim() : null;
    const forceRefresh = Boolean(body.forceRefresh);

    if (jobDescription.length < MIN_JD_CHARS) {
      return NextResponse.json(
        { ok: false, error: `Job description must be at least ${MIN_JD_CHARS} characters.` },
        { status: 400 },
      );
    }

    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json({ ok: false, error: "Server configuration error." }, { status: 500 });
    }

    const supabase = createClient(url, serviceKey);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "resume_raw_text, resume_url, skills, headline, summary, years_of_experience, education, work_experience, certifications",
      )
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 });
    }

    const resumeText = String(profile?.resume_raw_text ?? "").trim();
    if (resumeText.length < MIN_RESUME_CHARS) {
      return NextResponse.json(
        {
          ok: false,
          error: "Upload and parse your resume first. Go to Profile or Upload to add your resume.",
          code: "RESUME_MISSING",
        },
        { status: 422 },
      );
    }

    const result = await analyzeResumeIntelligence({
      userId: authData.user.id,
      resumeText,
      resumeUrl: profile?.resume_url ?? null,
      profileSnapshot: {
        skills: Array.isArray(profile?.skills) ? profile.skills : [],
        headline: profile?.headline,
        summary: profile?.summary,
        yearsOfExperience: profile?.years_of_experience,
        education: profile?.education,
        workExperience: profile?.work_experience,
        certifications: Array.isArray(profile?.certifications) ? profile.certifications : [],
      },
      jobDescription: truncateText(jobDescription, MAX_JD_CHARS),
      jobId,
      jobTitle,
      company,
      forceRefresh,
    });

    return NextResponse.json({
      ok: true,
      reportId: result.reportId,
      cached: result.cached,
      report: result.report,
    });
  } catch (error) {
    const formatted = formatTalentIntelligenceError(error);
    const headers: Record<string, string> = {};
    if (formatted.retryAfterSec) {
      headers["Retry-After"] = String(formatted.retryAfterSec);
    }
    return NextResponse.json(
      { ok: false, error: formatted.message, code: formatted.code },
      { status: formatted.status, headers },
    );
  }
}
