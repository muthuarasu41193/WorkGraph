"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  VAULT_REPORT_REASON_LABELS,
  VAULT_REPORT_REASONS,
  type VaultReportReason,
} from "@/lib/vault-trust";

type Props = {
  experienceId: string;
  isLoggedIn: boolean;
};

export function VaultReportForm({ experienceId, isLoggedIn }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<VaultReportReason>("misleading");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isLoggedIn) {
      window.location.href = `/login?next=/interview-vault/${experienceId}`;
      return;
    }
    setSubmitting(true);
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
      setOpen(false);
      setDetails("");
      toast({
        title: "Report submitted",
        description: data.message ?? "A person can review this report.",
        variant: "success",
      });
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

  if (!open) {
    return (
      <Button type="button" variant="ghost" onClick={() => setOpen(true)}>
        Report this guide
      </Button>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-3 rounded-card border border-hairline bg-surface p-4"
      aria-label="Report Interview Vault guide"
    >
      <p className="text-role-body-small text-ink-muted">
        Use this for materially misrepresented or inaccessible purchases, confidential content, or
        infringement. Do not upload work emails, identity documents, or offer letters here.
      </p>
      <div className="space-y-2">
        <Label htmlFor={`vault-report-reason-${experienceId}`}>Reason</Label>
        <select
          id={`vault-report-reason-${experienceId}`}
          value={reason}
          onChange={(e) => setReason(e.target.value as VaultReportReason)}
          className="flex h-10 w-full rounded-[var(--radius-button)] border border-border-default bg-surface px-3 text-role-body text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {VAULT_REPORT_REASONS.map((value) => (
            <option key={value} value={value}>
              {VAULT_REPORT_REASON_LABELS[value]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`vault-report-details-${experienceId}`}>Details (optional)</Label>
        <Textarea
          id={`vault-report-details-${experienceId}`}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Short description of the issue — no documents or email addresses"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit report"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
