/** Thin means this query returned few rows. It is not a market-size claim. */
export const THIN_RESULT_MAX = 4

export function thinCoverageNote(total: number | null | undefined): string | null {
  if (total == null || !Number.isFinite(total) || total < 0 || total > THIN_RESULT_MAX) return null
  if (total === 0) {
    return "This search returned no roles. The index may not cover this query. Try a broader role or remove a filter."
  }
  const noun = total === 1 ? "role" : "roles"
  return `This search returned ${total} ${noun}. That is a thin slice of this index, not a full market. Try a broader role.`
}

/** Minute precision in UTC. Null when the timestamp is missing. */
export function countedAtLabel(iso: string | null | undefined): string | null {
  if (!iso) return null
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return null
  const formatted = then.toISOString().slice(0, 16).replace("T", " ")
  return `Counted at ${formatted} UTC, when this page was rendered.`
}
