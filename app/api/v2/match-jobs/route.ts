import { NextResponse } from "next/server";
import { getSupabaseSessionUser } from "../../../../lib/route-auth";
import { logRouteError } from "../../../../lib/security/log";
import { ownedResumeTextForMatch } from "../../../../lib/security/resume-access";
import { matchJobsAccess, resolveAuthenticatedUserId } from "../../../../lib/security/session-identity";
import { createSupabaseAdminClient } from "../../../../lib/supabase-admin";
import { isValidationError, matchJobsBodySchema, parseWithSchema, publicErrorResponse } from "../../../../lib/validation";
import { matchJobsViaApi, workgraphApiEnabled } from "../../../../lib/workgraph-api";
import { buildResumeTextForMatch } from "../../../../lib/workgraph-dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Semantic match via FastAPI. Keyword ranking on the Jobs tab does not use this route.
 * Auth first; resume text is loaded from the session user's profile only.
 */
export async function POST(request: Request) {
  const {
    data: { user },
  } = await getSupabaseSessionUser(request);
  const sessionUserId = resolveAuthenticatedUserId(user ? { id: user.id } : null);
  const access = matchJobsAccess(sessionUserId, workgraphApiEnabled());
  if (access.status === 401) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (access.status === 503) {
    return NextResponse.json(
      { error: "WORKGRAPH_API_URL is not configured" },
      { status: 503 },
    );
  }
  const userId = access.userId;

  try {
    const rawBody = await request.json().catch(() => ({}));
    const body = parseWithSchema(matchJobsBodySchema, rawBody);
    const scopedUserId = resolveAuthenticatedUserId({ id: userId }, body.user_id);
    if (!scopedUserId || scopedUserId !== userId) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    const supabase = createSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Could not match jobs. Please try again." }, { status: 500 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("resume_raw_text, headline, summary, skills, work_experience")
      .eq("id", scopedUserId)
      .maybeSingle();

    const profileText = profile
      ? buildResumeTextForMatch({
          resume_raw_text: typeof profile.resume_raw_text === "string" ? profile.resume_raw_text : null,
          headline: typeof profile.headline === "string" ? profile.headline : null,
          summary: typeof profile.summary === "string" ? profile.summary : null,
          skills: Array.isArray(profile.skills)
            ? profile.skills.filter((s): s is string => typeof s === "string")
            : [],
          work_experience: Array.isArray(profile.work_experience)
            ? (profile.work_experience as Array<{
                title?: string;
                company?: string;
                duration?: string;
                description?: string;
              }>).map((exp) => ({
                title: String(exp.title ?? ""),
                company: String(exp.company ?? ""),
                duration: String(exp.duration ?? ""),
                description: String(exp.description ?? ""),
              }))
            : [],
        })
      : "";

    const resumeText = ownedResumeTextForMatch(profileText, body.resume_text);

    if (resumeText.length < 80) {
      return NextResponse.json(
        { error: "No resume found. Please upload your resume first." },
        { status: 400 },
      );
    }

    const result = await matchJobsViaApi(resumeText, body.top_k ?? 20);
    return NextResponse.json({ ...result, source: "workgraph-api" });
  } catch (err) {
    if (isValidationError(err)) {
      return publicErrorResponse(err, { fallback: "Invalid request." });
    }
    logRouteError("v2/match-jobs", err);
    return publicErrorResponse(err, { fallback: "Could not match jobs. Please try again." });
  }
}
