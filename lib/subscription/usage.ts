/**
 * Server-only usage ledger. Callers must pass the authenticated session user id.
 * Never accept a user id from the client body.
 */
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { uuidSchema } from "@/lib/validation/primitives";

import { isPaidFeature, type PaidFeature } from "./features";

export type UsageCountQuery = (userId: string, feature: PaidFeature, sinceIso: string) => Promise<number>;
export type UsageInsert = (userId: string, feature: PaidFeature) => Promise<void>;

export class UsageError extends Error {
  readonly code: "usage_count_failed" | "usage_record_failed" | "usage_invalid";

  constructor(code: UsageError["code"]) {
    super(code);
    this.name = code;
    this.code = code;
  }
}

function assertUsageArgs(userId: string, feature: string): asserts feature is PaidFeature {
  if (!uuidSchema.safeParse(userId).success || !isPaidFeature(feature)) {
    throw new UsageError("usage_invalid");
  }
}

async function defaultCount(userId: string, feature: PaidFeature, sinceIso: string): Promise<number> {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new UsageError("usage_count_failed");

  const { count, error } = await admin
    .from("feature_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", feature)
    .gte("created_at", sinceIso);

  if (error) throw new UsageError("usage_count_failed");
  if (typeof count !== "number" || !Number.isFinite(count) || count < 0) {
    throw new UsageError("usage_count_failed");
  }
  return count;
}

async function defaultInsert(userId: string, feature: PaidFeature): Promise<void> {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new UsageError("usage_record_failed");

  const { error } = await admin.from("feature_usage").insert({
    user_id: userId,
    feature,
  });
  if (error) throw new UsageError("usage_record_failed");
}

/** How many times this session user used `feature` since `since` (inclusive). */
export async function countUsageSince(
  userId: string,
  feature: PaidFeature,
  since: Date,
  deps?: { query?: UsageCountQuery },
): Promise<number> {
  assertUsageArgs(userId, feature);
  const sinceIso = since.toISOString();
  const query = deps?.query ?? defaultCount;
  try {
    return await query(userId, feature, sinceIso);
  } catch (error) {
    if (error instanceof UsageError) throw error;
    throw new UsageError("usage_count_failed");
  }
}

/** Record one use for the session user. Service role writes the row. */
export async function recordUsage(
  userId: string,
  feature: PaidFeature,
  deps?: { insert?: UsageInsert },
): Promise<void> {
  assertUsageArgs(userId, feature);
  const insert = deps?.insert ?? defaultInsert;
  try {
    await insert(userId, feature);
  } catch (error) {
    if (error instanceof UsageError) throw error;
    throw new UsageError("usage_record_failed");
  }
}
