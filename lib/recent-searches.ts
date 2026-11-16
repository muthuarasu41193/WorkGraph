export type RecentSearch = {
  id: string
  /** Free-text query the person typed. */
  q: string
  /** Full /jobs query string without the leading ?. */
  query: string
  at: number
}

const KEY = "wg-recent-searches"
const MAX = 8

export function readRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]") as RecentSearch[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.q === "string" &&
          typeof item.query === "string" &&
          typeof item.at === "number" &&
          item.q.trim().length > 0,
      )
      .slice(0, MAX)
  } catch {
    return []
  }
}

export function rememberRecentSearch(q: string, query: string): void {
  const trimmed = q.trim()
  if (!trimmed) return
  const next: RecentSearch[] = [
    { id: crypto.randomUUID(), q: trimmed, query, at: Date.now() },
    ...readRecentSearches().filter((item) => item.q.toLowerCase() !== trimmed.toLowerCase()),
  ].slice(0, MAX)
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new Event("wg-recent-searches"))
}

export function subscribeRecentSearches(onStoreChange: () => void): () => void {
  window.addEventListener("wg-recent-searches", onStoreChange)
  window.addEventListener("storage", onStoreChange)
  return () => {
    window.removeEventListener("wg-recent-searches", onStoreChange)
    window.removeEventListener("storage", onStoreChange)
  }
}

export function recentSearchesSnapshot(): string {
  return typeof window === "undefined" ? "" : localStorage.getItem(KEY) ?? ""
}
