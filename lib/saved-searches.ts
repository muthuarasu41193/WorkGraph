export type SavedSearch = {
  id: string
  name: string
  /** Query string for /jobs, without the leading question mark. */
  query: string
}

const KEY = "wg-saved-searches"
const EMPTY: SavedSearch[] = []

let cachedRaw: string | null = null
let cachedItems: SavedSearch[] = EMPTY

function parseSaved(raw: string): SavedSearch[] {
  try {
    const parsed = JSON.parse(raw) as SavedSearch[]
    if (!Array.isArray(parsed)) return EMPTY
    const items = parsed
      .filter((item) => item && typeof item.name === "string" && typeof item.query === "string" && typeof item.id === "string")
      .slice(0, 20)
    return items.length === 0 ? EMPTY : items
  } catch {
    return EMPTY
  }
}

export function readSavedSearches(): SavedSearch[] {
  if (typeof window === "undefined") return EMPTY
  const raw = localStorage.getItem(KEY) ?? "[]"
  if (raw === cachedRaw) return cachedItems
  cachedRaw = raw
  cachedItems = parseSaved(raw)
  return cachedItems
}

/** Stable string snapshot for useSyncExternalStore consumers. */
export function savedSearchesSnapshot(): string {
  if (typeof window === "undefined") return "[]"
  return localStorage.getItem(KEY) ?? "[]"
}

export function writeSavedSearches(items: SavedSearch[]): void {
  const next = items.slice(0, 20)
  localStorage.setItem(KEY, JSON.stringify(next))
  cachedRaw = JSON.stringify(next)
  cachedItems = next.length === 0 ? EMPTY : next
  window.dispatchEvent(new Event("wg-saved-searches"))
}

export function subscribeSavedSearches(onStoreChange: () => void): () => void {
  window.addEventListener("wg-saved-searches", onStoreChange)
  window.addEventListener("storage", onStoreChange)
  return () => {
    window.removeEventListener("wg-saved-searches", onStoreChange)
    window.removeEventListener("storage", onStoreChange)
  }
}
