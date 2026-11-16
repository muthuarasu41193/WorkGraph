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
import { toast } from "@/hooks/use-toast";
import { VAULT_REPORT_STATUSES, type VaultReportStatus } from "@/lib/vault/reports";

type ReportRow = {
  id: string;
  experience_id: string;
  reason: string;
  reasonLabel: string;
  details: string | null;
  status: string;
  statusLabel: string;
  created_at: string;
};

type Props = {
  initialReports: ReportRow[];
};

export default function VaultAdminReportsClient({ initialReports }: Props) {
  const [reports, setReports] = useState(initialReports);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<Record<string, string>>({});

  async function saveStatus(reportId: string) {
    const status = draftStatus[reportId];
    if (!status) return;
    setPendingId(reportId);
    try {
      const res = await fetch(`/api/admin/vault/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; note?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Update failed");
      setReports((prev) =>
        prev.map((row) =>
          row.id === reportId
            ? {
                ...row,
                status,
                statusLabel: status.replaceAll("_", " "),
              }
            : row,
        ),
      );
      toast({
        title: "Report updated",
        description: data.note ?? `Status set to ${status}.`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Could not update report",
        variant: "error",
      });
    } finally {
      setPendingId(null);
    }
  }

  if (reports.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground" role="status">
        No reports yet.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {reports.map((report) => (
        <li key={report.id} className="space-y-3 rounded-xl border p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium">{report.reasonLabel}</p>
              <p className="text-xs text-muted-foreground">
                Guide {report.experience_id} · {new Date(report.created_at).toLocaleString()} · {report.statusLabel}
              </p>
            </div>
          </div>
          {report.details ? <p className="text-sm text-muted-foreground">{report.details}</p> : null}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`status-${report.id}`}>Status</Label>
              <Select
                value={draftStatus[report.id] ?? report.status}
                onValueChange={(value) => setDraftStatus((prev) => ({ ...prev, [report.id]: value }))}
              >
                <SelectTrigger id={`status-${report.id}`} className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VAULT_REPORT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" disabled={pendingId === report.id} onClick={() => void saveStatus(report.id)}>
              {pendingId === report.id ? "Saving…" : "Update report status"}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export type { VaultReportStatus };
