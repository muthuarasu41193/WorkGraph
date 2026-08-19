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
};

export const LIMITS = {
  free: { coverLettersPerMonth: 3, interviewQuestionsPerWeek: 5 },
  premium: { coverLettersPerMonth: -1, interviewQuestionsPerWeek: -1 },
  pro: { coverLettersPerMonth: -1, interviewQuestionsPerWeek: -1 },
} as const;

const TIERS = new Set<SubscriptionTier>(["free", "premium", "pro"]);

function inactiveFree(): SubscriptionStatus {
  return { tier: "free", isActive: false };
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
  if (!supabaseConfigured()) return inactiveFree();

  try {
    const supabase = createServerSupabaseClient(await cookies());
    const { data, error } = await supabase
      .from("profiles")
      .select("subscription_tier, subscription_expires_at")
      .eq("id", parsedId.data)
      .maybeSingle();

    if (error) {
      logRouteError("subscription/check", error);
      return inactiveFree();
    }
    if (!data) return inactiveFree();

    const tier = parseTier((data as Record<string, unknown>).subscription_tier);
    const expiresAt = parseExpiresAt((data as Record<string, unknown>).subscription_expires_at);
    const isActive = tier !== "free" && (!expiresAt || expiresAt > new Date());

    return expiresAt ? { tier, isActive, expiresAt } : { tier, isActive };
  } catch (error) {
    logRouteError("subscription/check", error);
    return inactiveFree();
  }
}
