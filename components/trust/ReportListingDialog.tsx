"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import {
  LISTING_REPORT_CONFIRMATION,
  LISTING_REPORT_REASONS,
  type ListingReportReasonId,
} from "@/lib/accountability"
import { cn } from "@/lib/utils"

export function ReportListingDialog({
  jobId,
  jobTitle,
  jobCompany,
  triggerClassName,
}: {
  jobId: string
  jobTitle: string
  jobCompany: string
  triggerClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ListingReportReasonId | "">("")
  const [details, setDetails] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!reason || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/jobs/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          jobTitle,
          jobCompany,
          reason,
          details: details.trim() || undefined,
        }),
      })
      const json = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !json.ok) {
        setError(json.error ?? "The report did not save. Try again.")
        return
      }
      setDone(true)
    } catch {
      setError("The report did not save. The connection failed. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setReason("")
      setDetails("")
      setError(null)
      setDone(false)
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex min-h-11 items-center text-role-caption text-ink-muted underline-offset-2 hover:text-ink hover:underline",
            triggerClassName,
          )}
        >
          Report this listing
        </button>
      </DialogTrigger>
      <DialogContent className="md:max-w-md">
        <DialogHeader>
          <DialogTitle>Report this listing</DialogTitle>
          <DialogDescription>
            {jobTitle} at {jobCompany}. Tell us what looks wrong. A person reviews reports.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="space-y-3">
            <Text role="body-small">{LISTING_REPORT_CONFIRMATION}</Text>
            <DialogFooter>
              <Button type="button" className="min-h-11" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <fieldset>
              <legend className="text-role-caption text-ink-muted">Reason</legend>
              <div className="mt-2 flex flex-col gap-1">
                {LISTING_REPORT_REASONS.map((item) => (
                  <label
                    key={item.id}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-2 rounded-control border px-3 text-role-body-small",
                      reason === item.id ? "border-accent bg-accent-wash text-accent" : "border-hairline bg-surface",
                    )}
                  >
                    <input
                      type="radio"
                      name="listing-report-reason"
                      className="size-4 accent-[var(--color-accent)]"
                      checked={reason === item.id}
                      onChange={() => setReason(item.id)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block text-role-caption text-ink-muted">
              Optional detail
              <textarea
                className="mt-1 min-h-24 w-full rounded-control border border-hairline bg-surface px-3 py-2 text-role-body-small text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
                maxLength={2000}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="What did you see?"
              />
            </label>
            {error ? (
              <p className="text-role-caption text-danger" role="alert">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="min-h-11"
                disabled={!reason || submitting}
                loading={submitting}
                onClick={() => void submit()}
              >
                Submit report
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
