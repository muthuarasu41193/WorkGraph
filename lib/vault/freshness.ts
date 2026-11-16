/**
 * Interview Vault freshness helpers.
 * Product UI copy uses "confirmed" / "updated" — never "verified".
 * Analytics buckets are IDs/categories only — no guide body.
 */

/** Guides whose last confirmation is older than this many days show a stale indicator. */
export const VAULT_STALE_AFTER_DAYS = 180;

export const VAULT_FRESHNESS_BUCKETS = [
  "fresh_30d",
  "aging_90d",
  "stale_180d",
  "stale_365d",
  "unknown",
] as const;

export type VaultFreshnessBucket = (typeof VAULT_FRESHNESS_BUCKETS)[number];

const MS_PER_DAY = 86_400_000;

export function daysSinceIso(iso: string | null | undefined, now = Date.now()): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((now - then) / MS_PER_DAY);
}

export function isVaultGuideStale(
  contentConfirmedAt: string | null | undefined,
  options?: { now?: number; thresholdDays?: number },
): boolean {
  const threshold = options?.thresholdDays ?? VAULT_STALE_AFTER_DAYS;
  const days = daysSinceIso(contentConfirmedAt, options?.now);
  if (days == null) return true;
  return days > threshold;
}

export type VaultFreshnessDisplay = {
  lastUpdatedLabel: string | null;
  lastConfirmedLabel: string | null;
  stale: boolean;
  staleLabel: string | null;
};

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

export function vaultFreshnessDisplay(input: {
  updatedAt?: string | null;
  contentConfirmedAt?: string | null;
  now?: number;
  thresholdDays?: number;
}): VaultFreshnessDisplay {
  const stale = isVaultGuideStale(input.contentConfirmedAt, {
    now: input.now,
    thresholdDays: input.thresholdDays,
  });
  return {
    lastUpdatedLabel: input.updatedAt ? `Last updated ${formatShortDate(input.updatedAt)}` : null,
    lastConfirmedLabel: input.contentConfirmedAt
      ? `Last confirmed ${formatShortDate(input.contentConfirmedAt)}`
      : "Confirmation date not available",
    stale,
    staleLabel: stale ? "May be outdated" : null,
  };
}

/** Interview date shown as month and year only (never day). */
export function formatInterviewMonthYear(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "long" });
}

/** Guide age bucket for analytics (interview date based). */
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
