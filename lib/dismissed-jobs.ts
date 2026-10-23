const KEY = "wg-dismissed-jobs"

export type DismissedJob = { id: string; reason?: string }

export function readDismissedJobs(): DismissedJob[] {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]") as DismissedJob[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => item && typeof item.id === "string")
  } catch {
    return []
  }
}

export function writeDismissedJobs(items: DismissedJob[]): void {
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, 500)))
  window.dispatchEvent(new Event("wg-dismissed-jobs"))
}

export function subscribeDismissedJobs(onStoreChange: () => void): () => void {
  window.addEventListener("wg-dismissed-jobs", onStoreChange)
  window.addEventListener("storage", onStoreChange)
  return () => {
    window.removeEventListener("wg-dismissed-jobs", onStoreChange)
    window.removeEventListener("storage", onStoreChange)
  }
}

export function dismissedSnapshot(): string {
  return localStorage.getItem(KEY) ?? ""
}
