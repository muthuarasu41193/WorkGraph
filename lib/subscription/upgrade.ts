/** Client-safe Upgrade link for a paid-feature 402. No secrets. */

export const PASS_UPGRADE_HREF = "/pricing";
export const PASS_UPGRADE_LABEL = "Upgrade";

function safeUpgradeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export function upgradeHrefFromPayload(data: unknown): string {
  if (data && typeof data === "object") {
    const href = safeUpgradeHref((data as { upgradeUrl?: unknown }).upgradeUrl);
    if (href) return href;
  }
  return PASS_UPGRADE_HREF;
}

function formatUtcResetDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "the first day of next month";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Copy for the cover-letter 402 (`error: "limit_reached"`).
 * Returns null when the payload is not that limit response.
 */
export function limitNoticeFromPayload(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  if (row.error !== "limit_reached") return null;
  if (typeof row.limit === "number" && Number.isInteger(row.limit) && row.limit > 0 && typeof row.resetsAt === "string") {
    return `You've used your ${row.limit} free cover letters this month. They reset on ${formatUtcResetDate(row.resetsAt)}.`;
  }
  return "You've reached the free limit for this feature.";
}
