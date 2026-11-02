"use client"

import { useCallback, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Text } from "@/components/ui/text"
import { toast } from "@/hooks/use-toast"
import type { AlertMatchJob, JobAlert } from "@/lib/alerts/types"
import { readSavedSearches, subscribeSavedSearches } from "@/lib/saved-searches"
import type { AlertFrequency } from "@/lib/validation/alerts"

const IMPORT_DISMISS_KEY = "wg-alerts-import-dismissed"

function importDismissedSnapshot() {
  return window.localStorage.getItem(IMPORT_DISMISS_KEY) === "1"
}

function subscribeImportDismiss(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)
  window.addEventListener("wg-alerts-import-dismissed", onStoreChange)
  return () => {
    window.removeEventListener("storage", onStoreChange)
    window.removeEventListener("wg-alerts-import-dismissed", onStoreChange)
  }
}

function savedSearchesSnapshot() {
  return JSON.stringify(readSavedSearches())
}

const DISCREET_COPY =
  "Alerts go only to your email. Employers never see that you're looking. Subject lines stay generic."

type PreviewState = {
  since: string
  matches: AlertMatchJob[]
  estimateNote: string
} | null

export function AlertsPageClient({
  initialAlerts,
  hasPass,
}: {
  initialAlerts: JobAlert[]
  hasPass: boolean
}) {
  const [alerts, setAlerts] = useState(initialAlerts)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewState>(null)
  const [importing, setImporting] = useState(false)
  const savedRaw = useSyncExternalStore(subscribeSavedSearches, savedSearchesSnapshot, () => "[]")
  const importDismissed = useSyncExternalStore(subscribeImportDismiss, importDismissedSnapshot, () => true)
  const browserSearches = (() => {
    try {
      const parsed = JSON.parse(savedRaw) as ReturnType<typeof readSavedSearches>
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })()
  const showImport = browserSearches.length > 0 && !importDismissed

  const patchAlert = useCallback(async (id: string, body: Record<string, unknown>) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = (await res.json()) as { ok?: boolean; error?: string; alert?: JobAlert }
      if (!res.ok || !json.ok || !json.alert) {
        toast({ title: json.error ?? "Could not update alert", variant: "error" })
        return
      }
      setAlerts((prev) => prev.map((row) => (row.id === id ? json.alert! : row)))
    } finally {
      setBusyId(null)
    }
  }, [])

  async function removeAlert(id: string) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" })
      const json = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "Could not delete alert", variant: "error" })
        return
      }
      setAlerts((prev) => prev.filter((row) => row.id !== id))
      if (previewId === id) {
        setPreviewId(null)
        setPreview(null)
      }
      toast({ title: "Alert deleted", variant: "success" })
    } finally {
      setBusyId(null)
    }
  }

  async function loadPreview(id: string) {
    setPreviewId(id)
    setPreview(null)
    setBusyId(id)
    try {
      const res = await fetch(`/api/alerts/${id}/preview`)
      const json = (await res.json()) as {
        ok?: boolean
        error?: string
        since?: string
        matches?: AlertMatchJob[]
        estimateNote?: string
      }
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "Could not preview digest", variant: "error" })
        return
      }
      setPreview({
        since: json.since ?? "",
        matches: json.matches ?? [],
        estimateNote: json.estimateNote ?? "Match scores are estimates, not hiring probabilities.",
      })
    } finally {
      setBusyId(null)
    }
  }

  async function importBrowserSearches() {
    if (browserSearches.length === 0) return
    setImporting(true)
    let imported = 0
    try {
      for (const item of browserSearches) {
        if (alerts.length + imported >= 10) break
        const res = await fetch("/api/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name.slice(0, 80),
            query: item.query.slice(0, 500),
            frequency: "weekly",
            discreet: true,
            min_match: 40,
          }),
        })
        const json = (await res.json()) as { ok?: boolean; alert?: JobAlert; error?: string }
        if (res.ok && json.ok && json.alert) {
          setAlerts((prev) => [json.alert!, ...prev])
          imported += 1
        }
      }
      window.localStorage.setItem(IMPORT_DISMISS_KEY, "1")
      window.dispatchEvent(new Event("wg-alerts-import-dismissed"))
      toast({
        title: imported > 0 ? `Imported ${imported} alert${imported === 1 ? "" : "s"}` : "Nothing new to import",
        variant: imported > 0 ? "success" : "default",
      })
    } finally {
      setImporting(false)
    }
  }

  function dismissImport() {
    window.localStorage.setItem(IMPORT_DISMISS_KEY, "1")
    window.dispatchEvent(new Event("wg-alerts-import-dismissed"))
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-2">
        <Text as="h1" role="heading">
          Job alerts
        </Text>
        <Text role="body-small" className="text-ink-muted">
          {DISCREET_COPY}
        </Text>
        {!hasPass ? (
          <Text role="caption" className="text-ink-muted">
            Weekly digests are free.{" "}
            <Link href="/pricing" className="text-accent underline-offset-2 hover:underline">
              WorkGraph Pass
            </Link>{" "}
            unlocks daily.
          </Text>
        ) : null}
      </header>

      {showImport ? (
        <section className="rounded-card border border-hairline bg-surface-raised p-4">
          <Text as="h2" role="subheading">
            Import my saved searches from this browser
          </Text>
          <Text role="body-small" className="mt-2 text-ink-muted">
            {browserSearches.length} saved search{browserSearches.length === 1 ? "" : "es"} on this device can become
            weekly email alerts. Your browser copies stay as they are.
          </Text>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" className="min-h-11" loading={importing} onClick={() => void importBrowserSearches()}>
              Import once
            </Button>
            <Button type="button" variant="secondary" className="min-h-11" onClick={dismissImport}>
              Not now
            </Button>
          </div>
        </section>
      ) : null}

      {alerts.length === 0 ? (
        <section className="rounded-card border border-hairline bg-surface-raised p-4">
          <Text role="body-small" className="text-ink-muted">
            No alerts yet. On{" "}
            <Link href="/jobs" className="text-accent underline-offset-2 hover:underline">
              Jobs
            </Link>
            , use “Save as alert” next to “Save this search”.
          </Text>
        </section>
      ) : (
        <ul className="flex flex-col gap-4">
          {alerts.map((alert) => (
            <li key={alert.id} className="rounded-card border border-hairline bg-surface-raised p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Text as="h2" role="subheading" className="truncate">
                    {alert.name}
                  </Text>
                  <Text role="caption" className="mt-1 break-all text-ink-muted">
                    /jobs?{alert.query || "(all jobs)"}
                  </Text>
                  <Text role="caption" className="mt-1 text-ink-muted">
                    Min match {alert.min_match}% · {alert.frequency}
                  </Text>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11"
                  disabled={busyId === alert.id}
                  onClick={() => void removeAlert(alert.id)}
                >
                  Delete
                </Button>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`freq-${alert.id}`}>Frequency</Label>
                  <select
                    id={`freq-${alert.id}`}
                    className="min-h-11 rounded-input border border-hairline bg-surface px-3 text-role-body"
                    value={alert.frequency}
                    disabled={busyId === alert.id}
                    onChange={(event) => {
                      const frequency = event.target.value as AlertFrequency
                      void patchAlert(alert.id, { frequency })
                    }}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="daily" disabled={!hasPass && alert.frequency !== "daily"}>
                      Daily{hasPass ? "" : " (Pass)"}
                    </option>
                    <option value="off">Off</option>
                  </select>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-input border border-hairline px-3 py-2">
                  <div>
                    <Label htmlFor={`disc-${alert.id}`}>Discreet mode</Label>
                    <Text role="caption" className="text-ink-muted">
                      On by default
                    </Text>
                  </div>
                  <Switch
                    id={`disc-${alert.id}`}
                    checked={alert.discreet}
                    disabled={busyId === alert.id}
                    onCheckedChange={(checked) => void patchAlert(alert.id, { discreet: checked === true })}
                    aria-label="Discreet mode"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11"
                  loading={busyId === alert.id && previewId === alert.id}
                  onClick={() => void loadPreview(alert.id)}
                >
                  Preview next digest
                </Button>
                <Link
                  href={`/jobs?${alert.query}`}
                  className="inline-flex min-h-11 items-center px-3 text-role-body-small text-accent"
                >
                  Open search
                </Link>
              </div>

              {previewId === alert.id && preview ? (
                <div className="mt-4 border-t border-hairline pt-4">
                  <Text role="subheading">Preview</Text>
                  <Text role="caption" className="mt-1 text-ink-muted">
                    Jobs posted since {new Date(preview.since).toLocaleString("en-IN", { timeZone: "Asia/Calcutta" })}{" "}
                    (Asia/Calcutta). {preview.estimateNote}
                  </Text>
                  {preview.matches.length === 0 ? (
                    <Text role="body-small" className="mt-2 text-ink-muted">
                      No matching jobs in that window yet.
                    </Text>
                  ) : (
                    <ul className="mt-3 flex flex-col gap-2">
                      {preview.matches.map((job) => (
                        <li key={job.id} className="text-role-body-small">
                          <span className="font-medium text-ink">{job.title}</span>
                          <span className="text-ink-muted">
                            {" "}
                            · {job.company} · estimate {job.matchPercent}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-card border border-hairline bg-surface-raised p-4">
        <Text as="h2" role="subheading">
          Discreet by default
        </Text>
        <Text role="body-small" className="mt-2 text-ink-muted">
          {DISCREET_COPY}
        </Text>
      </section>
    </div>
  )
}
