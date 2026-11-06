/** Relative posted label for job cards. Exact local time belongs in a title tooltip. */

export function formatPostedRelative(
  iso: string | null | undefined,
  nowMs: number = Date.now(),
  locale?: string,
): string | null {
  if (!iso) return null
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return null
  const diffSeconds = Math.round((then.getTime() - nowMs) / 1000)
  const abs = Math.abs(diffSeconds)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
  if (abs < 60) return rtf.format(diffSeconds, "second")
  const diffMinutes = Math.round(diffSeconds / 60)
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute")
  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour")
  const diffDays = Math.round(diffHours / 24)
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, "day")
  const diffMonths = Math.round(diffDays / 30)
  return rtf.format(diffMonths, "month")
}

export function formatPostedExactLocal(
  iso: string | null | undefined,
  locale?: string,
): string | null {
  if (!iso) return null
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return null
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(then)
}
