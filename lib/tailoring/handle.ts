/**
 * POST /api/tailoring handler. Session-scoped; never accepts resume text from the client.
 */
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireCoverLetterSession, type CoverLetterSession } from "@/lib/cover-letters/session";
import { fetchLiveJobByPublicId } from "@/lib/jobs-catalog";
import { logErrorCode, logRouteError } from "@/lib/security/log";
import { canUse, type Entitlement } from "@/lib/subscription/entitlements";
import { recordUsage } from "@/lib/subscription/usage";
import {
  isValidationError,
  parseWithSchema,
  publicErrorResponse,
} from "@/lib/validation";
import { tailoringRequestSchema } from "@/lib/validation/tailoring";

import { runEvidenceTailoring, type RunTailoringParams, type TailoringRunResult } from "./service";

export type ResumeLoadResult =
  | { ok: true; resumeText: string; skills: string[] }
  | { ok: false; status: number; error: string };

export type JobLoadResult =
  | {
      ok: true;
      jobId: string;
      title: string;
      company: string;
      description: string;
    }
  | { ok: false; status: number; error: string };

export type TailoringDependencies = {
  requireSession: (request: Request) => Promise<CoverLetterSession>;
  loadResume: (session: Extract<CoverLetterSession, { ok: true }>) => Promise<ResumeLoadResult>;
  loadJob: (
    session: Extract<CoverLetterSession, { ok: true }>,
    jobId: string,
  ) => Promise<JobLoadResult>;
  run: (params: RunTailoringParams) => Promise<TailoringRunResult>;
  canUseFeature?: (userId: string, feature: "tailoring") => Promise<Entitlement>;
  record?: (userId: string, feature: "tailoring") => Promise<void>;
};

export async function loadTailoringResume(
  session: { supabase: SupabaseClient; userId: string },
): Promise<ResumeLoadResult> {
  const { data: profile, error } = await session.supabase
    .from("profiles")
    .select("id, resume_raw_text, skills")
    .eq("id", session.userId)
    .single();

  if (error || !profile) {
    return { ok: false, status: 404, error: "Profile not found." };
  }

  const resumeText =
    typeof profile.resume_raw_text === "string" ? profile.resume_raw_text.trim() : "";
  if (!resumeText) {
    return {
      ok: false,
      status: 400,
      error: "No resume found. Upload your resume before tailoring for a job.",
    };
  }

  const skills = Array.isArray(profile.skills)
    ? profile.skills.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  return { ok: true, resumeText, skills };
}

export async function loadTailoringJob(
  session: { supabase: SupabaseClient },
  jobId: string,
): Promise<JobLoadResult> {
  const row = await fetchLiveJobByPublicId(session.supabase, jobId);
  if (!row) {
    return { ok: false, status: 404, error: "Job not found." };
  }
  const description = typeof row.description === "string" ? row.description.trim() : "";
  return {
    ok: true,
    jobId: row.external_id || String(row.id),
    title: row.title || "Role",
    company: row.company || "Company",
    description,
  };
}

function limitResponse(decision: Entitlement) {
  if (decision.reason === "limit_reached") {
    return NextResponse.json(
      {
        error: "limit_reached",
        used: decision.used,
        limit: decision.limit,
        resetsAt: decision.resetsAt,
        upgradeUrl: "/pricing",
      },
      { status: 402 },
    );
  }
  return NextResponse.json(
    { error: "Could not tailor your resume right now. Please try again." },
    { status: 503 },
  );
}

export async function handleTailoringRequest(
  request: Request,
  deps: Partial<TailoringDependencies> = {},
): Promise<NextResponse> {
  const requireSession = deps.requireSession ?? requireCoverLetterSession;
  const loadResume = deps.loadResume ?? loadTailoringResume;
  const loadJob = deps.loadJob ?? loadTailoringJob;
  const run = deps.run ?? runEvidenceTailoring;
  const canUseFeature = deps.canUseFeature ?? ((userId: string) => canUse(userId, "tailoring"));
  const record = deps.record ?? ((userId: string) => recordUsage(userId, "tailoring"));

  try {
    const rawBody = await request.json().catch(() => ({}));
    const body = parseWithSchema(tailoringRequestSchema, rawBody);

    const auth = await requireSession(request);
    if (!auth.ok) return auth.response;

    const resume = await loadResume(auth);
    if (!resume.ok) {
      return NextResponse.json({ error: resume.error }, { status: resume.status });
    }

    const job = await loadJob(auth, body.jobId);
    if (!job.ok) {
      return NextResponse.json({ error: job.error }, { status: job.status });
    }

    const decision = await canUseFeature(auth.userId, "tailoring");
    if (!decision.allowed) return limitResponse(decision);

    try {
      const result = await run({
        resumeText: resume.resumeText,
        jobTitle: job.title,
        company: job.company,
        jobDescription: job.description,
        profileSkills: resume.skills,
      });

      try {
        await record(auth.userId, "tailoring");
      } catch (error) {
        logErrorCode("tailoring", "usage_record_failed");
        logRouteError("tailoring", error);
      }

      return NextResponse.json({
        suggestions: result.suggestions.map((item) => ({
          sourceId: item.sourceId,
          rewrite: item.rewrite,
          jobRequirement: item.jobRequirement,
          sourceText: item.sourceText,
        })),
        gaps: result.gaps,
        rejectedCount: result.rejectedCount,
        privacy:
          "Tailoring sends your resume text and this job description to Groq (the existing AI processor). Results are not stored — copy what you want.",
      });
    } catch (error) {
      logRouteError("tailoring", error);
      return NextResponse.json(
        { error: "Could not tailor your resume right now. Please try again." },
        { status: 500 },
      );
    }
  } catch (error) {
    if (isValidationError(error)) {
      return publicErrorResponse(error, { fallback: "Invalid request." });
    }
    logRouteError("tailoring", error);
    return publicErrorResponse(error, {
      fallback: "Could not tailor your resume right now. Please try again.",
    });
  }
}
