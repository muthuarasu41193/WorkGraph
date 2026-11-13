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
  VAULT_REFUND_POLICY_PLACEHOLDER,
  VAULT_REFUND_REASON_LABELS,
  VAULT_REFUND_REASONS,
  type VaultRefundReason,
} from "@/lib/vault/refunds";

type Props = {
  experienceId: string;
  isLoggedIn: boolean;
  canRequest: boolean;
  windowDays: number;
};

export default function VaultRefundForm({ experienceId, isLoggedIn, canRequest, windowDays }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  async function submitRefund() {
    if (!isLoggedIn) {
      window.location.href = `/login?next=/interview-vault/${experienceId}`;
      return;
    }
    if (!reason) {
      toast({ title: "Choose a reason", description: "Select why you are requesting a refund.", variant: "error" });
      return;
    }
    setSubmitting(true);
    setStatusMessage("");
    try {
      const res = await fetch(`/api/vault/experiences/${experienceId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details: details.trim() || undefined }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Could not submit refund request.");
      }
      setStatusMessage(data.message ?? "Refund request recorded for manual review.");
      setOpen(false);
      setReason("");
      setDetails("");
      toast({ title: "Refund request submitted", description: data.message, variant: "success" });
    } catch (err) {
      toast({
        title: "Refund request failed",
        description: err instanceof Error ? err.message : "Could not submit refund request",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!canRequest && !statusMessage) {
    return null;
  }

  return (
    <section aria-labelledby="refund-request-heading" className="space-y-3 rounded-xl border border-dashed p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="refund-request-heading" className="text-sm font-semibold">
          Request a refund
        </h2>
        {canRequest ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? "Cancel refund request" : "Request a refund"}
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Eligible buyers can request a refund within about {windowDays} days of purchase for inaccessible or materially
        misrepresented content. Requests are reviewed manually.
      </p>
      <p className="text-xs text-muted-foreground">{VAULT_REFUND_POLICY_PLACEHOLDER}</p>
      {statusMessage ? (
        <p className="text-sm text-positive" role="status" aria-live="polite">
          {statusMessage}
        </p>
      ) : null}
      {open && canRequest ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="refund-reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="refund-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {VAULT_REFUND_REASONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {VAULT_REFUND_REASON_LABELS[value as VaultRefundReason]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="refund-details">Details (optional)</Label>
            <Textarea
              id="refund-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Describe the issue. Do not paste guide content, resumes, or payment details."
            />
          </div>
          <Button type="button" onClick={() => void submitRefund()} disabled={submitting || !reason}>
            {submitting ? "Submitting refund request…" : "Submit refund request"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
