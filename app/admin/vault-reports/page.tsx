import type { Metadata } from "next";
import { notFound } from "next/navigation";

import VaultAdminReportsClient from "@/components/vault/VaultAdminReportsClient";
import { getSessionUser } from "@/lib/auth/session-server";
import { isAdminEmail, resolveAdminMetricsAccess } from "@/lib/metrics/admin";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { VAULT_REPORT_REASON_LABELS, VAULT_REPORT_STATUS_LABELS } from "@/lib/vault/reports";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vault guide reports",
  robots: { index: false, follow: false },
};

type ReportRow = {
  id: string;
  experience_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
};

export default async function AdminVaultReportsPage() {
  const user = await getSessionUser();
  if (resolveAdminMetricsAccess(user?.email) !== "ok" || !isAdminEmail(user?.email)) {
    notFound();
  }

  const admin = createSupabaseAdminClient();
  let reports: ReportRow[] = [];
  let loadError: string | null = null;

  if (!admin) {
    loadError = "Admin tools are unavailable (missing service role).";
  } else {
    const { data, error } = await admin
      .from("vault_guide_reports")
      .select("id, experience_id, reason, details, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      loadError = "Could not load reports.";
    } else {
      reports = (data ?? []) as ReportRow[];
    }
  }

  return (
    <main id="main-content" className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Vault guide reports</h1>
        <p className="text-sm text-muted-foreground">
          Set status to removed to hide a guide from the Vault and prep-pack matches. Purchaser refunds remain an open
          product decision.
        </p>
      </header>
      {loadError ? (
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : (
        <VaultAdminReportsClient
          initialReports={reports.map((row) => ({
            ...row,
            reasonLabel:
              VAULT_REPORT_REASON_LABELS[row.reason as keyof typeof VAULT_REPORT_REASON_LABELS] ?? row.reason,
            statusLabel:
              VAULT_REPORT_STATUS_LABELS[row.status as keyof typeof VAULT_REPORT_STATUS_LABELS] ?? row.status,
          }))}
        />
      )}
    </main>
  );
}
