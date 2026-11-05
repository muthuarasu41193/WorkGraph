/** Relative “Updated …” label from a counted-at timestamp. Exact local time is for tooltips. */

export function formatUpdatedRelative(
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

  if (abs < 60) return `Updated ${rtf.format(diffSeconds, "second")}`
  const diffMinutes = Math.round(diffSeconds / 60)
  if (Math.abs(diffMinutes) < 60) return `Updated ${rtf.format(diffMinutes, "minute")}`
  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return `Updated ${rtf.format(diffHours, "hour")}`
  const diffDays = Math.round(diffHours / 24)
  return `Updated ${rtf.format(diffDays, "day")}`
}

export function formatExactLocalTime(
  iso: string | null | undefined,
  locale?: string,
): string | null {
  if (!iso) return null
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return null
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(then)
}
