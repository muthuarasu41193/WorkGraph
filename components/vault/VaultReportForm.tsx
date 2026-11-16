"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  VAULT_REPORT_REASON_LABELS,
  VAULT_REPORT_REASONS_UI,
  type VaultReportReason,
} from "@/lib/vault/reports";

type Props = {
  experienceId: string;
  isLoggedIn: boolean;
};

export default function VaultReportForm({ experienceId, isLoggedIn }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  async function submitReport() {
    if (!isLoggedIn) {
      window.location.href = `/login?next=/interview-vault/${experienceId}`;
      return;
    }
    if (!reason) {
      toast({ title: "Choose a reason", description: "Select why you are reporting this guide.", variant: "error" });
      return;
    }
    setSubmitting(true);
    setStatusMessage("");
    try {
      const res = await fetch(`/api/vault/experiences/${experienceId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details: details.trim() || undefined }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Could not submit report.");
      }
      setStatusMessage(data.message ?? "Report received.");
      setOpen(false);
      setReason("");
      setDetails("");
      toast({ title: "Report submitted", description: data.message, variant: "success" });
    } catch (err) {
      toast({
        title: "Report failed",
        description: err instanceof Error ? err.message : "Could not submit report",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="report-guide-heading" className="space-y-3 rounded-xl border border-dashed p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="report-guide-heading" className="text-sm font-semibold">
          Report this guide
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? "Cancel" : "Report this guide"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Signed-in users can report problems. Anonymous reporting is not available so we can limit abuse and keep
        reports tied to an account.
      </p>
      {statusMessage ? (
        <p className="text-sm text-positive" role="status" aria-live="polite">
          {statusMessage}
        </p>
      ) : null}
      {open ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="report-reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="report-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {VAULT_REPORT_REASONS_UI.map((value) => (
                  <SelectItem key={value} value={value}>
                    {VAULT_REPORT_REASON_LABELS[value as VaultReportReason]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-details">Details (optional)</Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Do not include emails, resumes, or confidential employer documents."
            />
          </div>
          <Button type="button" onClick={() => void submitReport()} disabled={submitting || !reason}>
            {submitting ? "Submitting…" : "Submit report"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
