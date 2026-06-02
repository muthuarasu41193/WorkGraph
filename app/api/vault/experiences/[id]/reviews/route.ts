import { NextResponse } from "next/server";
import { VaultApiError, listReviewsForExperience, submitReview } from "@/lib/vault-server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const reviews = await listReviewsForExperience(id);
    return NextResponse.json({ ok: true, reviews });
  } catch (err) {
    if (err instanceof VaultApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to load reviews";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { rating?: number; comment?: string };
    if (body.rating == null) {
      return NextResponse.json({ ok: false, error: "Rating is required" }, { status: 400 });
    }
    const review = await submitReview(id, body.rating, body.comment);
    return NextResponse.json({ ok: true, review }, { status: 201 });
  } catch (err) {
    if (err instanceof VaultApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to submit review";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
