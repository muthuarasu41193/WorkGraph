import { cookies } from "next/headers";
import { logRouteError } from "@/lib/security/log";
import { createServerSupabaseClient } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase-enabled";
import { uuidSchema } from "@/lib/validation/primitives";

export type SubscriptionTier = "free" | "premium" | "pro";

export type SubscriptionStatus = {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt?: Date;
  /** True when the profile row could not be read. A missing profile stays false. */
  readFailed?: boolean;
};

export const LIMITS = {
  free: { coverLettersPerMonth: 3, interviewQuestionsPerWeek: 5, tailoringPerMonth: 2 },
  premium: { coverLettersPerMonth: -1, interviewQuestionsPerWeek: -1, tailoringPerMonth: -1 },
  pro: { coverLettersPerMonth: -1, interviewQuestionsPerWeek: -1, tailoringPerMonth: -1 },
} as const;

const TIERS = new Set<SubscriptionTier>(["free", "premium", "pro"]);

function inactiveFree(readFailed = false): SubscriptionStatus {
  return readFailed
    ? { tier: "free", isActive: false, readFailed: true }
    : { tier: "free", isActive: false };
}

/** Map a profile read to a tier. `failed` means the database read errored, not that the row is missing. */
export function resolveSubscriptionStatus(
  row: { subscription_tier?: unknown; subscription_expires_at?: unknown } | null,
  failed: boolean,
  now = new Date(),
): SubscriptionStatus {
  if (failed) return inactiveFree(true);
  if (!row) return inactiveFree();

  const tier = parseTier(row.subscription_tier);
  const expiresAt = parseExpiresAt(row.subscription_expires_at);
  const isActive = tier !== "free" && (!expiresAt || expiresAt > now);
  return expiresAt ? { tier, isActive, expiresAt } : { tier, isActive };
}

function parseTier(value: unknown): SubscriptionTier {
  return typeof value === "string" && TIERS.has(value as SubscriptionTier)
    ? (value as SubscriptionTier)
    : "free";
}

function parseExpiresAt(value: unknown): Date | undefined {
  if (typeof value !== "string" && !(value instanceof Date)) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * Server-only. Pass the authenticated session user id — never a client-supplied id.
 * Fail closed to free when the profile is missing, RLS hides the row, or Supabase is down.
 */
export async function checkSubscription(userId: string): Promise<SubscriptionStatus> {
  const parsedId = uuidSchema.safeParse(userId);
  if (!parsedId.success) return inactiveFree();
  if (!supabaseConfigured()) return inactiveFree(true);

  try {
    const supabase = createServerSupabaseClient(await cookies());
    const { data, error } = await supabase
      .from("profiles")
      .select("subscription_tier, subscription_expires_at")
      .eq("id", parsedId.data)
      .maybeSingle();

    if (error) {
      logRouteError("subscription/check", error);
      return inactiveFree(true);
    }

    const row = data as { subscription_tier?: unknown; subscription_expires_at?: unknown } | null;
    return resolveSubscriptionStatus(row, false);
  } catch (error) {
    logRouteError("subscription/check", error);
    return inactiveFree(true);
  }
}
