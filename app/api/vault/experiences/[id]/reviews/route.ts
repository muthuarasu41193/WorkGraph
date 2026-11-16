import { NextResponse } from "next/server";

import { logRouteError } from "@/lib/security/log";
import {
  VaultApiError,
  deleteOwnReview,
  listReviewsForExperience,
  submitReview,
  updateOwnReview,
} from "@/lib/vault-server";
import { vaultReviewBodySchema } from "@/lib/validation/vault";

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
    logRouteError("vault/reviews-list", err);
    return NextResponse.json({ ok: false, error: "Failed to load reviews" }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const json = await request.json().catch(() => null);
    const parsed = vaultReviewBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Rating must be an integer from 1 to 5." }, { status: 400 });
    }
    const review = await submitReview(id, parsed.data.rating, parsed.data.comment ?? undefined);
    return NextResponse.json({ ok: true, review }, { status: 201 });
  } catch (err) {
    if (err instanceof VaultApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    logRouteError("vault/reviews-create", err);
    return NextResponse.json({ ok: false, error: "Failed to submit review" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const json = await request.json().catch(() => null);
    const reviewId = typeof json?.reviewId === "string" ? json.reviewId : null;
    if (!reviewId) {
      return NextResponse.json({ ok: false, error: "reviewId is required." }, { status: 400 });
    }
    const parsed = vaultReviewBodySchema.safeParse({
      rating: json?.rating,
      comment: json?.comment,
    });
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Rating must be an integer from 1 to 5." }, { status: 400 });
    }
    const review = await updateOwnReview(id, reviewId, parsed.data.rating, parsed.data.comment ?? undefined);
    return NextResponse.json({ ok: true, review });
  } catch (err) {
    if (err instanceof VaultApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    logRouteError("vault/reviews-update", err);
    return NextResponse.json({ ok: false, error: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const url = new URL(request.url);
    const reviewId = url.searchParams.get("reviewId");
    if (!reviewId) {
      return NextResponse.json({ ok: false, error: "reviewId is required." }, { status: 400 });
    }
    await deleteOwnReview(id, reviewId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof VaultApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    logRouteError("vault/reviews-delete", err);
    return NextResponse.json({ ok: false, error: "Failed to delete review" }, { status: 500 });
  }
}
