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
  VAULT_REFUND_STATUS_LABELS,
  VAULT_REFUND_STATUSES,
  type VaultRefundStatus,
} from "@/lib/vault/refunds";

type RefundRow = {
  id: string;
  experience_id: string;
  reason: string;
  reasonLabel: string;
  details: string | null;
  status: string;
  statusLabel: string;
  contributor_response: string | null;
  created_at: string;
};

type Props = {
  initialRefunds: RefundRow[];
};

export default function VaultAdminRefundsClient({ initialRefunds }: Props) {
  const [refunds, setRefunds] = useState(initialRefunds);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<Record<string, string>>({});
  const [draftNote, setDraftNote] = useState<Record<string, string>>({});

  async function saveStatus(requestId: string) {
    const status = draftStatus[requestId];
    if (!status) return;
    setPendingId(requestId);
    try {
      const res = await fetch(`/api/admin/vault/refunds/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          admin_note: draftNote[requestId]?.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; note?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Update failed");
      setRefunds((prev) =>
        prev.map((row) =>
          row.id === requestId
            ? {
                ...row,
                status,
                statusLabel:
                  VAULT_REFUND_STATUS_LABELS[status as VaultRefundStatus] ?? status.replaceAll("_", " "),
              }
            : row,
        ),
      );
      toast({
        title: "Refund request updated",
        description: data.note ?? `Status set to ${status}.`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Could not update refund request",
        variant: "error",
      });
    } finally {
      setPendingId(null);
    }
  }

  if (refunds.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground" role="status">
        No refund requests yet.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {refunds.map((refund) => (
        <li key={refund.id} className="space-y-3 rounded-xl border p-4">
          <div>
            <p className="font-medium">{refund.reasonLabel}</p>
            <p className="text-xs text-muted-foreground">
              Guide {refund.experience_id} · {new Date(refund.created_at).toLocaleString()} · {refund.statusLabel} ·
              manual processing
            </p>
          </div>
          {refund.details ? <p className="text-sm text-muted-foreground">{refund.details}</p> : null}
          {refund.contributor_response ? (
            <p className="text-sm">
              <span className="font-medium">Contributor response: </span>
              {refund.contributor_response}
            </p>
          ) : null}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`refund-status-${refund.id}`}>Status</Label>
              <Select
                value={draftStatus[refund.id] ?? refund.status}
                onValueChange={(value) => setDraftStatus((prev) => ({ ...prev, [refund.id]: value }))}
              >
                <SelectTrigger id={`refund-status-${refund.id}`} className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VAULT_REFUND_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {VAULT_REFUND_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[16rem] flex-1 space-y-1.5">
              <Label htmlFor={`refund-note-${refund.id}`}>Admin note (optional)</Label>
              <Textarea
                id={`refund-note-${refund.id}`}
                value={draftNote[refund.id] ?? ""}
                onChange={(e) => setDraftNote((prev) => ({ ...prev, [refund.id]: e.target.value }))}
                maxLength={1000}
                rows={2}
                placeholder="Internal note only. Do not paste payment secrets."
              />
            </div>
            <Button type="button" disabled={pendingId === refund.id} onClick={() => void saveStatus(refund.id)}>
              {pendingId === refund.id ? "Saving…" : "Update refund status"}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
