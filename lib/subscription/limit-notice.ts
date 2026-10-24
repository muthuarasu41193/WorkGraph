/** Client-safe copy for the cover-letter monthly cap. No server or database imports. */

export function formatUtcResetDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "the first day of next month";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function coverLetterLimitNotice(limit: number, resetsAt: string): string {
  const count = Number.isInteger(limit) && limit > 0 ? limit : 3;
  return `You've used your ${count} free cover letters this month. They reset on ${formatUtcResetDate(resetsAt)}.`;
}

export function parseCoverLetterLimitPayload(
  data: unknown,
): { limit: number; resetsAt: string } | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  if (row.error !== "limit_reached") return null;
  if (typeof row.limit !== "number" || !Number.isInteger(row.limit) || row.limit <= 0) return null;
  if (typeof row.resetsAt !== "string" || row.resetsAt.trim().length === 0) return null;
  return { limit: row.limit, resetsAt: row.resetsAt };
}
