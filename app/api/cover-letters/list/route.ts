import { NextResponse } from "next/server";

import { requireCoverLetterSession } from "@/lib/cover-letters/session";
import { logRouteError } from "@/lib/security/log";
import { publicErrorResponse } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireCoverLetterSession(request);
    if (!auth.ok) return auth.response;

    const { data, error } = await auth.supabase
      .from("cover_letters")
      .select("id, job_title, company, created_at")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false });

    if (error) {
      logRouteError("cover-letters/list", error);
      return NextResponse.json(
        { error: "Could not load your cover letters. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ letters: data ?? [] });
  } catch (error) {
    logRouteError("cover-letters/list", error);
    return publicErrorResponse(error, {
      fallback: "Could not load your cover letters. Please try again.",
    });
  }
}
