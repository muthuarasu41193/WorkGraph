/**
 * Verified-purchaser review helpers (Milestone V4).
 * "Verified purchaser" means only that the reviewer bought the guide on WorkGraph.
 * Do not ask about or display job-offer outcomes.
 */

import { hasVaultEntitlement, type VaultPurchaseRecord } from "@/lib/security/vault-entitlement";

export const VAULT_REVIEW_COMMENT_MAX = 2000;
export const VAULT_REVIEW_RATING_MIN = 1;
export const VAULT_REVIEW_RATING_MAX = 5;

/** Explainer shown near the review list. */
export const VAULT_VERIFIED_PURCHASER_EXPLAINER =
  "“Verified purchaser” means only that this review comes from someone who bought the guide on WorkGraph. It does not describe interview outcomes, job offers, or the accuracy of the guide.";

export type VaultReviewEligibility =
  | { allowed: true; purchaseId: string }
  | { allowed: false; status: number; error: string };

/**
 * Only entitled buyers (verified payment, not the seller) may review.
 * One review per purchase is enforced by unique(purchase_id) + server checks.
 */
export function authorizeVaultReviewWrite(input: {
  userId: string | null | undefined;
  sellerId: string;
  priceInr: number;
  purchase: (VaultPurchaseRecord & { id?: string; payment_status: string }) | null;
}): VaultReviewEligibility {
  if (!input.userId) {
    return { allowed: false, status: 401, error: "Sign in to leave a review." };
  }
  if (input.userId === input.sellerId) {
    return { allowed: false, status: 403, error: "Contributors cannot review their own guide." };
  }
  const entitled = hasVaultEntitlement({
    viewerId: input.userId,
    sellerId: input.sellerId,
    priceInr: input.priceInr,
    purchase: input.purchase,
  });
  if (!entitled || input.purchase?.payment_status !== "verified" || !input.purchase.id) {
    return {
      allowed: false,
      status: 403,
      error: "A verified purchase is required to leave a review.",
    };
  }
  return { allowed: true, purchaseId: input.purchase.id };
}

export function validateVaultReviewInput(input: {
  rating: unknown;
  comment?: unknown;
}): { ok: true; rating: number; comment: string | null } | { ok: false; error: string } {
  const rating = typeof input.rating === "number" ? input.rating : Number(input.rating);
  if (!Number.isInteger(rating) || rating < VAULT_REVIEW_RATING_MIN || rating > VAULT_REVIEW_RATING_MAX) {
    return { ok: false, error: "Rating must be an integer from 1 to 5." };
  }
  if (input.comment == null || input.comment === "") {
    return { ok: true, rating, comment: null };
  }
  if (typeof input.comment !== "string") {
    return { ok: false, error: "Comment must be text." };
  }
  const comment = input.comment.trim();
  if (comment.length > VAULT_REVIEW_COMMENT_MAX) {
    return { ok: false, error: `Comment must be at most ${VAULT_REVIEW_COMMENT_MAX} characters.` };
  }
  // Soft content guard: reject obvious outcome probing, not a legal filter.
  const lower = comment.toLowerCase();
  if (lower.includes("did you get an offer") || lower.includes("did they get the job")) {
    return { ok: false, error: "Reviews must not ask about or discuss job-offer outcomes." };
  }
  return { ok: true, rating, comment: comment || null };
}

/** Public review projection: never expose hidden rows to non-authors. */
export function publicVaultReviewFields(row: {
  id: string;
  experience_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at?: string | null;
  purchase_id?: string | null;
  hidden_at?: string | null;
  viewerId?: string | null;
}): {
  id: string;
  experience_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string | null;
  verified_purchaser: true;
  is_own: boolean;
} | null {
  const isOwn = Boolean(row.viewerId && row.viewerId === row.user_id);
  if (row.hidden_at && !isOwn) return null;
  return {
    id: row.id,
    experience_id: row.experience_id,
    user_id: row.user_id,
    rating: row.rating,
    comment: row.comment,
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
    verified_purchaser: true,
    is_own: isOwn,
  };
}
