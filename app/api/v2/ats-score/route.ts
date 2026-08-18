import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBearerToken, getSupabaseSessionUser } from "../../../../lib/route-auth";
import {
  atsScoreBodySchema,
  isValidationError,
  parseAiAtsFeedback,
  parseWithSchema,
  publicErrorResponse,
} from "../../../../lib/validation";
import { scoreAtsViaApi, workgraphApiEnabled } from "../../../../lib/workgraph-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function defaultJobDescription(profile: {
  headline?: string | null;
  skills?: unknown;
}): string {
  const skills = Array.isArray(profile.skills)
    ? profile.skills.filter((s): s is string => typeof s === "string").join(", ")
    : "";
  const headline = typeof profile.headline === "string" ? profile.headline : "Software Engineer";
  return `We are hiring a ${headline}. Required skills include: ${skills || "communication, collaboration, problem solving"}. 
Experience with modern tools, measurable impact, and clear resume formatting preferred.`;
}

function mapFeedback(raw: Record<string, unknown>): ReturnType<typeof parseAiAtsFeedback> {
  const suggestions =
    Array.isArray(raw.optimization_suggestions) && raw.optimization_suggestions.length > 0
      ? raw.optimization_suggestions
      : raw.suggestions;
  return parseAiAtsFeedback({ ...raw, suggestions });
}

export async function POST(request: Request) {
  if (!workgraphApiEnabled()) {
    const url = new URL("/api/ats-score", request.url);
    const forward = new Request(url, {
      method: "POST",
      headers: request.headers,
      body: request.body,
      duplex: "half",
    } as RequestInit);
    return fetch(forward);
  }

  try {
    const rawBody = await request.json().catch(() => ({}));
    const body = parseWithSchema(atsScoreBodySchema, rawBody);

    const supabase = createClient(
      getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );

    let userId: string | null = null;
    const bearer = getBearerToken(request);
    if (bearer) {
      const { data: { user } } = await supabase.auth.getUser(bearer);
      userId = user?.id ?? null;
    }
    if (!userId) {
      const { data: { user } } = await getSupabaseSessionUser(request);
      userId = user?.id ?? null;
    }
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, resume_raw_text, headline, skills")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const resumeText =
      body.resume_text?.trim() ||
      (typeof profile.resume_raw_text === "string" ? profile.resume_raw_text.trim() : "");

    if (!resumeText) {
      return NextResponse.json({ error: "No resume text. Upload a resume first." }, { status: 400 });
    }

    const jobDescription =
      body.job_description?.trim() || defaultJobDescription(profile);

    const raw = await scoreAtsViaApi(resumeText, jobDescription, userId);
    const atsFeedback = mapFeedback(raw as unknown as Record<string, unknown>);

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        ats_score: atsFeedback.score,
        ats_feedback: atsFeedback,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: "Could not save ATS results. Please try again." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ...atsFeedback,
      profile: updatedProfile,
      source: "workgraph-api",
    });
  } catch (err) {
    if (isValidationError(err)) {
      return publicErrorResponse(err, { fallback: "Invalid request." });
    }
    return publicErrorResponse(err, { fallback: "Could not score your resume. Please try again." });
  }
}
