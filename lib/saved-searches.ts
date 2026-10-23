export type SavedSearch = {
  id: string
  name: string
  /** Query string for /jobs, without the leading question mark. */
  query: string
}

const KEY = "wg-saved-searches"

export function readSavedSearches(): SavedSearch[] {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]") as SavedSearch[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item) => item && typeof item.name === "string" && typeof item.query === "string" && typeof item.id === "string")
      .slice(0, 20)
  } catch {
    return []
  }
}

export function writeSavedSearches(items: SavedSearch[]): void {
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, 20)))
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
