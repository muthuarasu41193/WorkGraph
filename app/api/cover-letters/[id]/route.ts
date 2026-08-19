import { NextResponse } from "next/server";

import { requireCoverLetterSession } from "@/lib/cover-letters/session";
import { logRouteError } from "@/lib/security/log";
import {
  coverLetterIdSchema,
  isValidationError,
  parseWithSchema,
  publicErrorResponse,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const NOT_FOUND = { error: "Cover letter not found." };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    parseWithSchema(coverLetterIdSchema, id);

    const auth = await requireCoverLetterSession(request);
    if (!auth.ok) return auth.response;

    const { data, error } = await auth.supabase
      .from("cover_letters")
      .select("id, job_title, company, job_description, generated_letter, created_at")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (error) {
      logRouteError("cover-letters/get", error);
      return NextResponse.json(
        { error: "Could not load this cover letter. Please try again." },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      job_title: data.job_title,
      company: data.company,
      job_description: data.job_description,
      letter: data.generated_letter,
      created_at: data.created_at,
    });
  } catch (error) {
    if (isValidationError(error)) {
      return publicErrorResponse(error, { fallback: "Invalid cover letter id." });
    }
    logRouteError("cover-letters/get", error);
    return publicErrorResponse(error, {
      fallback: "Could not load this cover letter. Please try again.",
    });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    parseWithSchema(coverLetterIdSchema, id);

    const auth = await requireCoverLetterSession(request);
    if (!auth.ok) return auth.response;

    const { data, error } = await auth.supabase
      .from("cover_letters")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.userId)
      .select("id")
      .maybeSingle();

    if (error) {
      logRouteError("cover-letters/delete", error);
      return NextResponse.json(
        { error: "Could not delete this cover letter. Please try again." },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isValidationError(error)) {
      return publicErrorResponse(error, { fallback: "Invalid cover letter id." });
    }
    logRouteError("cover-letters/delete", error);
    return publicErrorResponse(error, {
      fallback: "Could not delete this cover letter. Please try again.",
    });
  }
}
