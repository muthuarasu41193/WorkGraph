export type QueuedAction = {
  id: string
  kind: "application-status"
  applicationId: string
  status: string
  label: string
}

const KEY = "wg-offline-queue"

export function parseOfflineQueue(raw: string | null): QueuedAction[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as QueuedAction[]
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.kind === "application-status" && typeof item.applicationId === "string") : []
  } catch {
    return []
  }
}

export function readOfflineQueue(): QueuedAction[] {
  if (typeof window === "undefined") return []
  return parseOfflineQueue(localStorage.getItem(KEY))
}

export function writeOfflineQueue(items: QueuedAction[]): void {
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, 50)))
  window.dispatchEvent(new Event("wg-offline-queue"))
}

export function enqueueOfflineAction(action: QueuedAction): void {
  const next = [...readOfflineQueue().filter((item) => item.id !== action.id), action]
  writeOfflineQueue(next)
}

export function subscribeOfflineQueue(onStoreChange: () => void): () => void {
  window.addEventListener("wg-offline-queue", onStoreChange)
  window.addEventListener("storage", onStoreChange)
  return () => {
    window.removeEventListener("wg-offline-queue", onStoreChange)
    window.removeEventListener("storage", onStoreChange)
  }
}
