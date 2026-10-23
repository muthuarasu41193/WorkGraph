"use client"

import { useSyncExternalStore } from "react"
import { toast } from "@/hooks/use-toast"
import { readOfflineQueue, subscribeOfflineQueue, writeOfflineQueue } from "@/lib/offline-queue"

let replaying = false

function subscribeOnline(onStoreChange: () => void) {
  function onOnline() {
    onStoreChange()
    void replay()
  }
  window.addEventListener("online", onOnline)
  window.addEventListener("offline", onStoreChange)
  if (navigator.onLine) void replay()
  return () => {
    window.removeEventListener("online", onOnline)
    window.removeEventListener("offline", onStoreChange)
  }
}

export function OfflineBanner() {
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true)
  const queued = useSyncExternalStore(subscribeOfflineQueue, () => String(readOfflineQueue().length), () => "0")

  if (online) return null

  return (
    <div className="fixed inset-x-0 top-0 z-toast border-b border-hairline bg-surface-raised px-4 py-2 text-role-caption text-ink" role="status">
      You are offline. Saved changes wait on this device until the connection returns.
      {queued !== "0" ? ` ${queued} waiting.` : ""}
    </div>
  )
}

async function replay() {
  if (replaying || !navigator.onLine) return
  const items = readOfflineQueue()
  if (items.length === 0) return
  replaying = true
  try {
    const remaining = []
    for (const item of items) {
      const res = await fetch(`/api/applications/${item.applicationId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: item.status }),
      })
      if (!res.ok) remaining.push(item)
    }
    writeOfflineQueue(remaining)
    if (remaining.length === 0) toast({ title: "Saved the waiting updates", variant: "success" })
    else toast({ title: "Some waiting updates did not save", description: "Open the tracker and move the stage again.", variant: "error" })
  } finally {
    replaying = false
  }
}
