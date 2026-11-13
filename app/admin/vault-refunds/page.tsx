import type { Metadata } from "next";
import { notFound } from "next/navigation";

import VaultAdminRefundsClient from "@/components/vault/VaultAdminRefundsClient";
import { getSessionUser } from "@/lib/auth/session-server";
import { isAdminEmail, resolveAdminMetricsAccess } from "@/lib/metrics/admin";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  VAULT_REFUND_POLICY_PLACEHOLDER,
  VAULT_REFUND_REASON_LABELS,
  VAULT_REFUND_STATUS_LABELS,
} from "@/lib/vault/refunds";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vault refund requests",
  robots: { index: false, follow: false },
};

type RefundRow = {
  id: string;
  experience_id: string;
  reason: string;
  details: string | null;
  status: string;
  contributor_response: string | null;
  created_at: string;
};

export default async function AdminVaultRefundsPage() {
  const user = await getSessionUser();
  if (resolveAdminMetricsAccess(user?.email) !== "ok" || !isAdminEmail(user?.email)) {
    notFound();
  }

  const admin = createSupabaseAdminClient();
  let refunds: RefundRow[] = [];
  let loadError: string | null = null;

  if (!admin) {
    loadError = "Admin tools are unavailable (missing service role).";
  } else {
    const { data, error } = await admin
      .from("vault_refund_requests")
      .select("id, experience_id, reason, details, status, contributor_response, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      loadError = "Could not load refund requests.";
    } else {
      refunds = (data ?? []) as RefundRow[];
    }
  }

  return (
    <main id="main-content" className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Vault refund requests</h1>
        <p className="text-sm text-muted-foreground">
          Triage buyer refund requests. Marking a request approved or refunded does not execute a payment-provider
          refund or change earnings. Depends on Milestone D.
        </p>
        <p className="text-xs text-muted-foreground">{VAULT_REFUND_POLICY_PLACEHOLDER}</p>
      </header>
      {loadError ? (
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : (
        <VaultAdminRefundsClient
          initialRefunds={refunds.map((row) => ({
            ...row,
            reasonLabel:
              VAULT_REFUND_REASON_LABELS[row.reason as keyof typeof VAULT_REFUND_REASON_LABELS] ?? row.reason,
            statusLabel:
              VAULT_REFUND_STATUS_LABELS[row.status as keyof typeof VAULT_REFUND_STATUS_LABELS] ?? row.status,
          }))}
        />
      )}
    </main>
  );
}
