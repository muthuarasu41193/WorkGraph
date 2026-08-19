import { NextResponse } from "next/server";

import { generateCoverLetter } from "@/lib/cover-letters/service";
import { requireCoverLetterSession } from "@/lib/cover-letters/session";
import { logRouteError } from "@/lib/security/log";
import {
  coverLetterGenerateSchema,
  isValidationError,
  parseWithSchema,
  publicErrorResponse,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => ({}));
    const body = parseWithSchema(coverLetterGenerateSchema, rawBody);

    const auth = await requireCoverLetterSession(request);
    if (!auth.ok) return auth.response;

    const { data: profile, error: profileError } = await auth.supabase
      .from("profiles")
      .select("id, resume_raw_text")
      .eq("id", auth.userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const resumeText =
      typeof profile.resume_raw_text === "string" ? profile.resume_raw_text.trim() : "";
    if (!resumeText) {
      return NextResponse.json(
        { error: "No resume found. Please upload your resume first." },
        { status: 400 },
      );
    }

    try {
      const letter = await generateCoverLetter({
        jobTitle: body.jobTitle,
        company: body.company,
        jobDescription: body.jobDescription,
        resumeText,
      });
      return NextResponse.json({ letter });
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
