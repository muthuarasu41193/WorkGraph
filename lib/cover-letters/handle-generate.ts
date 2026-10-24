import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { logRouteError } from "@/lib/security/log";
import {
  coverLetterGenerateSchema,
  isValidationError,
  parseWithSchema,
  publicErrorResponse,
} from "@/lib/validation";

import { requireCoverLetterSession, type CoverLetterSession } from "./session";
import { generateCoverLetter, type GenerateCoverLetterParams, type GeneratedCoverLetter } from "./service";

export type ResumeLoadResult =
  | { ok: true; resumeText: string }
  | { ok: false; status: number; error: string };

export type CoverLetterGenerateDependencies = {
  requireSession: (request: Request) => Promise<CoverLetterSession>;
  loadResumeText: (session: Extract<CoverLetterSession, { ok: true }>) => Promise<ResumeLoadResult>;
  generate: (params: GenerateCoverLetterParams) => Promise<GeneratedCoverLetter>;
};

/**
 * Resume text is read from the session user's profile row.
 * A user id or resume in the request body is never used.
 */
export async function loadCoverLetterResumeText(session: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<ResumeLoadResult> {
  const { data: profile, error: profileError } = await session.supabase
    .from("profiles")
    .select("id, resume_raw_text")
    .eq("id", session.userId)
    .single();

  if (profileError || !profile) {
    return { ok: false, status: 404, error: "Profile not found." };
  }

  const resumeText =
    typeof profile.resume_raw_text === "string" ? profile.resume_raw_text.trim() : "";
  if (!resumeText) {
    return {
      ok: false,
      status: 400,
      error: "No resume found. Please upload your resume first.",
    };
  }

  return { ok: true, resumeText };
}

export async function handleCoverLetterGenerate(
  request: Request,
  deps: CoverLetterGenerateDependencies = {
    requireSession: requireCoverLetterSession,
    loadResumeText: loadCoverLetterResumeText,
    generate: generateCoverLetter,
  },
): Promise<NextResponse> {
  try {
    const rawBody = await request.json().catch(() => ({}));
    const body = parseWithSchema(coverLetterGenerateSchema, rawBody);

    const auth = await deps.requireSession(request);
    if (!auth.ok) return auth.response;

    const resume = await deps.loadResumeText(auth);
    if (!resume.ok) {
      return NextResponse.json({ error: resume.error }, { status: resume.status });
    }

    try {
      const generated = await deps.generate({
        jobTitle: body.jobTitle,
        company: body.company,
        jobDescription: body.jobDescription,
        resumeText: resume.resumeText,
      });
      if (typeof generated.letter !== "string" || !generated.letter.trim()) {
        return NextResponse.json(
          { error: "Could not generate a cover letter. Please try again." },
          { status: 500 },
        );
      }
      const warnings = Array.isArray(generated.warnings)
        ? generated.warnings.filter((item) => typeof item === "string" && item.trim().length > 0)
        : [];
      return NextResponse.json({ letter: generated.letter, warnings });
    } catch (err) {
      logRouteError("cover-letters/generate", err);
      return NextResponse.json(
        { error: "Could not generate a cover letter. Please try again." },
        { status: 500 },
      );
    }
  } catch (error) {
    if (isValidationError(error)) {
      return publicErrorResponse(error, { fallback: "Invalid request." });
    }
    logRouteError("cover-letters/generate", error);
    return publicErrorResponse(error, {
      fallback: "Could not generate a cover letter. Please try again.",
    });
  }
}
