/** Client-safe pass copy. No secrets and no database access. */

export function formatInrFromPaise(paise: number): string {
  const rupees = paise / 100;
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees);
  return `₹${formatted}`;
}

/** Calendar date in India Standard Time, where the pass is sold. */
export function formatPassUntil(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const label = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
  return `${label} IST`;
}

export type PassView =
  | { kind: "active"; untilLabel: string }
  | { kind: "expired"; untilLabel: string }
  | { kind: "pro" }
  | { kind: "none" };

export function describePass(
  tier: string | null | undefined,
  expiresAt: string | null | undefined,
  now = new Date(),
): PassView {
  if (tier === "pro") return { kind: "pro" };
  if (tier !== "premium") return { kind: "none" };
  if (!expiresAt) return { kind: "active", untilLabel: "" };
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return { kind: "none" };
  const untilLabel = formatPassUntil(expiresAt);
  if (date.getTime() > now.getTime()) return { kind: "active", untilLabel };
  return { kind: "expired", untilLabel };
}

export function activePassSentence(untilLabel: string): string {
  return untilLabel
    ? `WorkGraph Pass active until ${untilLabel}.`
    : "WorkGraph Pass is active.";
}
