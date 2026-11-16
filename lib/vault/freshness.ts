/**
 * Guide freshness buckets for analytics (IDs/categories only — no guide body).
 */

export const VAULT_FRESHNESS_BUCKETS = [
  "fresh_30d",
  "aging_90d",
  "stale_180d",
  "stale_365d",
  "unknown",
] as const;

export type VaultFreshnessBucket = (typeof VAULT_FRESHNESS_BUCKETS)[number];

const MS_PER_DAY = 86_400_000;

export function vaultGuideFreshnessBucket(
  interviewDate: string | null | undefined,
  nowMs: number = Date.now(),
): VaultFreshnessBucket {
  if (!interviewDate) return "unknown";
  const parsed = Date.parse(interviewDate);
  if (!Number.isFinite(parsed)) return "unknown";
  const ageDays = Math.floor((nowMs - parsed) / MS_PER_DAY);
  if (ageDays < 0) return "fresh_30d";
  if (ageDays <= 30) return "fresh_30d";
  if (ageDays <= 90) return "aging_90d";
  if (ageDays <= 180) return "stale_180d";
  return "stale_365d";
}

/** Compact id for product_events props (no hyphens; fits PROP_ENUM_RE). */
export function eventSafeId(id: string): string {
  return id.replace(/-/g, "").slice(0, 32);
}
