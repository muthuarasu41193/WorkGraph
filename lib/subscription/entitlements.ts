/**
 * Server-only. One gate for paid features.
 * Job search, matching, the tracker, and hidden jobs must not call this.
 */
import { logErrorCode } from "@/lib/security/log";
import { uuidSchema } from "@/lib/validation/primitives";

import { isPaidFeature, type PaidFeature } from "./features";
import { checkSubscription, LIMITS, type SubscriptionStatus, type SubscriptionTier } from "./index";
import { countUsageSince } from "./usage";

export type EntitlementReason = "ok" | "limit_reached" | "unavailable";

export type Entitlement = {
  allowed: boolean;
  used: number;
  limit: number;
  resetsAt: string | null;
  tier: SubscriptionTier;
  reason: EntitlementReason;
};

export type CanUseDeps = {
  now?: Date;
  readSubscription?: (userId: string) => Promise<SubscriptionStatus>;
  countUsage?: (userId: string, feature: PaidFeature, since: Date) => Promise<number>;
};

/** Free monthly cap. Unconfigured paid features are 0 so the gate fails closed. -1 means unlimited. */
export function freeMonthlyLimit(feature: PaidFeature): number {
  switch (feature) {
    case "cover_letter":
      return LIMITS.free.coverLettersPerMonth;
    case "tailoring":
      return LIMITS.free.tailoringPerMonth;
    default:
      return 0;
  }
}

export function utcMonthWindow(now: Date): { since: Date; resetsAt: Date } {
  const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const resetsAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { since, resetsAt };
}

function blocked(
  feature: PaidFeature,
  now: Date,
  reason: "limit_reached" | "unavailable",
  used = 0,
): Entitlement {
  const { resetsAt } = utcMonthWindow(now);
  return {
    allowed: false,
    used,
    limit: freeMonthlyLimit(feature),
    resetsAt: resetsAt.toISOString(),
    tier: "free",
    reason,
  };
}

/**
 * Paid and unexpired is unlimited. Everyone else uses the free monthly cap (UTC).
 * A database error denies the feature. It does not open the free quota.
 */
export async function canUse(
  userId: string,
  feature: PaidFeature,
  deps?: CanUseDeps,
): Promise<Entitlement> {
  const now = deps?.now ?? new Date();
  const read = deps?.readSubscription ?? checkSubscription;
  const count = deps?.countUsage ?? countUsageSince;

  if (!isPaidFeature(feature) || !uuidSchema.safeParse(userId).success) {
    logErrorCode("subscription/entitlement", "entitlement_unavailable");
    const { resetsAt } = utcMonthWindow(now);
    return {
      allowed: false,
      used: 0,
      limit: isPaidFeature(feature) ? freeMonthlyLimit(feature) : 0,
      resetsAt: resetsAt.toISOString(),
      tier: "free",
      reason: "unavailable",
    };
  }

  let status: SubscriptionStatus;
  try {
    status = await read(userId);
  } catch {
    logErrorCode("subscription/entitlement", "entitlement_unavailable");
    return blocked(feature, now, "unavailable");
  }

  if (status.readFailed) {
    logErrorCode("subscription/entitlement", "entitlement_unavailable");
    return blocked(feature, now, "unavailable");
  }

  if (status.isActive && status.tier !== "free") {
    return {
      allowed: true,
      used: 0,
      limit: -1,
      resetsAt: null,
      tier: status.tier,
      reason: "ok",
    };
  }

  const limit = freeMonthlyLimit(feature);
  const { since, resetsAt } = utcMonthWindow(now);
  if (limit <= 0) {
    return {
      allowed: false,
      used: 0,
      limit: 0,
      resetsAt: resetsAt.toISOString(),
      tier: "free",
      reason: "limit_reached",
    };
  }

  let used: number;
  try {
    used = await count(userId, feature, since);
  } catch {
    logErrorCode("subscription/entitlement", "usage_count_failed");
    return blocked(feature, now, "unavailable");
  }

  if (!Number.isFinite(used) || used < 0) {
    logErrorCode("subscription/entitlement", "usage_count_failed");
    return blocked(feature, now, "unavailable");
  }

  const allowed = used < limit;
  return {
    allowed,
    used,
    limit,
    resetsAt: resetsAt.toISOString(),
    tier: "free",
    reason: allowed ? "ok" : "limit_reached",
  };
}
