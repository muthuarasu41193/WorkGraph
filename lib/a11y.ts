/** Move a roving index without wrapping past either end. */
export function nextListIndex(index: number, delta: number, length: number): number {
  if (length <= 0) return 0
  const last = length - 1
  return Math.min(Math.max(index + delta, 0), last)
}

/** Screen-reader text for the job that keyboard focus landed on. */
export function feedFocusAnnouncement(title: string, company: string, index: number, total: number): string {
  if (!title || total <= 0) return ""
  return `${title} at ${company}. ${index + 1} of ${total}.`
}
