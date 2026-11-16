/**
 * Interview Vault refund request model (Milestone V4).
 * Refunds are recorded and triaged manually. Do not execute payment-provider
 * refunds or change earnings unless Milestone D wiring exists.
 */

export const VAULT_REFUND_REASONS = [
  "inaccessible_after_purchase",
  "materially_misrepresented",
] as const;

export type VaultRefundReason = (typeof VAULT_REFUND_REASONS)[number];

export const VAULT_REFUND_REASON_LABELS: Record<VaultRefundReason, string> = {
  inaccessible_after_purchase: "Inaccessible content after purchase",
  materially_misrepresented: "Materially misrepresented content",
};

export const VAULT_REFUND_STATUSES = ["open", "approved", "denied", "refunded"] as const;
export type VaultRefundStatus = (typeof VAULT_REFUND_STATUSES)[number];

export const VAULT_REFUND_STATUS_LABELS: Record<VaultRefundStatus, string> = {
  open: "Open",
  approved: "Approved (manual)",
  denied: "Denied",
  refunded: "Marked refunded (manual)",
};

export const VAULT_REFUND_DETAILS_MAX = 2000;
export const VAULT_REFUND_RESPONSE_MAX = 2000;

/** Default request window in days. Override with VAULT_REFUND_WINDOW_DAYS. */
export const VAULT_REFUND_WINDOW_DAYS_DEFAULT = 14;

const MS_PER_DAY = 86_400_000;

/** NEEDS COUNSEL REVIEW — window, criteria, and who bears cost are policy decisions. */
export const VAULT_REFUND_POLICY_PLACEHOLDER =
  "Refund requests for inaccessible or materially misrepresented Interview Vault guides may be submitted within a configurable window after purchase. Requests are reviewed manually. WorkGraph does not automatically execute payment refunds or adjust contributor earnings until a verified payment-provider path exists (Milestone D). Who bears the cost of an approved refund is undecided. NEEDS COUNSEL REVIEW.";

export function isVaultRefundReason(value: string): value is VaultRefundReason {
  return (VAULT_REFUND_REASONS as readonly string[]).includes(value);
}

export function isVaultRefundStatus(value: string): value is VaultRefundStatus {
  return (VAULT_REFUND_STATUSES as readonly string[]).includes(value);
}

export function getVaultRefundWindowDays(envValue?: string | null): number {
  const raw = (envValue ?? process.env.VAULT_REFUND_WINDOW_DAYS ?? "").trim();
  if (!raw) return VAULT_REFUND_WINDOW_DAYS_DEFAULT;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || n > 365) return VAULT_REFUND_WINDOW_DAYS_DEFAULT;
  return Math.floor(n);
}

export function isWithinRefundWindow(input: {
  purchasedAt: string;
  now?: number;
  windowDays?: number;
}): boolean {
  const purchased = Date.parse(input.purchasedAt);
  if (!Number.isFinite(purchased)) return false;
  const windowDays = input.windowDays ?? getVaultRefundWindowDays();
  const now = input.now ?? Date.now();
  return now - purchased <= windowDays * MS_PER_DAY;
}

/**
 * Admin may move open → approved|denied|refunded, approved → refunded|denied,
 * and reopen only via open (rare). Clients never set refunded without admin.
 */
export function canTransitionRefundStatus(
  from: VaultRefundStatus,
  to: VaultRefundStatus,
): boolean {
  if (from === to) return true;
  if (from === "open") return to === "approved" || to === "denied" || to === "refunded";
  if (from === "approved") return to === "refunded" || to === "denied" || to === "open";
  if (from === "denied") return to === "open";
  if (from === "refunded") return false;
  return false;
}

export type VaultRefundAuthDecision =
  | { allowed: true }
  | { allowed: false; status: number; error: string };

/** Entitled buyers with a verified purchase may request a refund within the window. */
export function authorizeVaultRefundRequest(input: {
  userId: string | null | undefined;
  sellerId: string;
  purchase: { id: string; payment_status: string; created_at: string } | null;
  existingRequest: boolean;
  now?: number;
  windowDays?: number;
}): VaultRefundAuthDecision {
  if (!input.userId) {
    return { allowed: false, status: 401, error: "Sign in to request a refund." };
  }
  if (input.userId === input.sellerId) {
    return { allowed: false, status: 403, error: "Contributors cannot request a refund on their own guide." };
  }
  if (!input.purchase || input.purchase.payment_status !== "verified") {
    return { allowed: false, status: 403, error: "A verified purchase is required to request a refund." };
  }
  if (input.existingRequest) {
    return { allowed: false, status: 409, error: "A refund request already exists for this purchase." };
  }
  if (
    !isWithinRefundWindow({
      purchasedAt: input.purchase.created_at,
      now: input.now,
      windowDays: input.windowDays,
    })
  ) {
    return {
      allowed: false,
      status: 403,
      error: "The refund request window for this purchase has ended.",
    };
  }
  return { allowed: true };
}
