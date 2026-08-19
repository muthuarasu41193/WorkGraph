import { NextResponse } from "next/server";

import { requireCoverLetterSession } from "@/lib/cover-letters/session";
import { logRouteError } from "@/lib/security/log";
import {
  coverLetterSaveSchema,
  isValidationError,
  parseWithSchema,
  publicErrorResponse,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => ({}));
    const body = parseWithSchema(coverLetterSaveSchema, rawBody);

    const auth = await requireCoverLetterSession(request);
    if (!auth.ok) return auth.response;

    const { data, error } = await auth.supabase
      .from("cover_letters")
      .insert({
        user_id: auth.userId,
        job_title: body.jobTitle,
        company: body.company,
        job_description: body.jobDescription ?? null,
        generated_letter: body.letter,
      })
      .select("id, created_at")
      .single();

    if (error || !data) {
      logRouteError("cover-letters/save", error);
      return NextResponse.json(
        { error: "Could not save your cover letter. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      id: data.id as string,
      created_at: data.created_at as string,
    });
  } catch (error) {
    if (isValidationError(error)) {
      return publicErrorResponse(error, { fallback: "Invalid request." });
    }
    logRouteError("cover-letters/save", error);
    return publicErrorResponse(error, {
      fallback: "Could not save your cover letter. Please try again.",
    });
  }
}
