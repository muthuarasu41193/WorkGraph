"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, ShoppingBag, Wallet } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import VaultCompanyEmailConfirm from "@/components/vault/VaultCompanyEmailConfirm";
import VaultEarningsChart from "@/components/vault/VaultEarningsChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { convertInrToCurrency, formatCurrencyAmount, type SupportedCurrency } from "@/lib/currency";
import VaultFreshness from "@/components/vault/VaultFreshness";
import { formatUsdEarnings } from "@/lib/vault/earnings";
import { VAULT_RESULT_LABELS, type VaultDashboardStats } from "@/lib/vault";

type Props = {
  dashboard: VaultDashboardStats;
  currency: SupportedCurrency;
};

export default function VaultDashboard({ dashboard, currency }: Props) {
  const [withdrawing, setWithdrawing] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [experiences, setExperiences] = useState(dashboard.experiences);

  async function markGuideCurrent(id: string) {
    setConfirmingId(id);
    try {
      const res = await fetch(`/api/vault/experiences/${id}/confirm`, { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        experience?: { content_confirmed_at?: string | null; updated_at?: string };
      };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Could not mark guide as current");
      setExperiences((prev) =>
        prev.map((exp) =>
          exp.id === id
            ? {
                ...exp,
                content_confirmed_at: data.experience?.content_confirmed_at ?? new Date().toISOString(),
                updated_at: data.experience?.updated_at ?? exp.updated_at,
                stale: false,
                stale_label: null,
                last_confirmed_label: "Last confirmed just now",
              }
            : exp,
        ),
      );
      toast({ title: "Guide marked as current", variant: "success" });
    } catch (err) {
      toast({
        title: "Could not update guide",
        description: err instanceof Error ? err.message : "Try again",
        variant: "error",
      });
    } finally {
      setConfirmingId(null);
    }
  }

  async function requestWithdrawal() {
    setWithdrawing(true);
    try {
      const res = await fetch("/api/vault/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "withdraw" }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? data.message ?? "Payouts are not available yet.");
      }
      toast({ title: "Withdrawal requested", description: data.message, variant: "success" });
    } catch (err) {
      toast({
        title: "Payouts unavailable",
        description: err instanceof Error ? err.message : "Could not request withdrawal",
        variant: "error",
      });
    } finally {
      setWithdrawing(false);
    }
  }

  const stats = [
    {
      label: "Gross (verified, USD)",
      value: formatUsdEarnings(dashboard.gross_earnings_usd),
      icon: Wallet,
    },
    { label: "Total views", value: dashboard.total_views.toLocaleString("en-IN"), icon: Eye },
    { label: "Verified sales", value: dashboard.total_sales.toLocaleString("en-IN"), icon: ShoppingBag },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Seller Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Earnings from verified purchases only. Amounts below are estimates in US dollars.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/interview-vault/sell">Create new experience</Link>
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <VaultCompanyEmailConfirm />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fee breakdown (USD)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Gross verified sales:{" "}
            <strong>{formatUsdEarnings(dashboard.gross_earnings_usd)}</strong>
            {" · "}
            Platform fee ({dashboard.fee_rate_percent_label}):{" "}
            <strong>{formatUsdEarnings(dashboard.platform_fee_usd)}</strong>
            {" · "}
            Estimated net: <strong>{formatUsdEarnings(dashboard.net_earnings_usd)}</strong>
          </p>
          <p className="text-xs text-muted-foreground" role="note">
            {dashboard.fee_policy_note} Recorded purchase amounts are stored in INR (
            {formatCurrencyAmount(
              convertInrToCurrency(dashboard.total_earnings_inr, currency),
              currency,
            )}{" "}
            in your display currency). No income projections or payout guarantees.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sales over time</CardTitle>
        </CardHeader>
        <CardContent>
          <VaultEarningsChart salesByDay={dashboard.sales_by_day} currency={currency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-lg">Your experiences</CardTitle>
          <Button
            onClick={() => void requestWithdrawal()}
            disabled={withdrawing}
            variant="outline"
            aria-describedby="vault-payout-status"
          >
            <Wallet className={iconClass()} />
            {withdrawing ? "Checking payouts…" : "Check payout availability"}
          </Button>
        </CardHeader>
        <CardContent>
          <p id="vault-payout-status" className="mb-3 text-xs text-muted-foreground">
            Contributor payouts are not enabled. This control confirms availability; it does not move
            money.
          </p>
          {experiences.length > 0 ? (
            <ul className="divide-y">
              {experiences.map((exp) => (
                <li key={exp.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 space-y-1">
                    <Link href={`/interview-vault/${exp.id}`} className="font-medium hover:text-primary">
                      {exp.company || "Untitled"} — {exp.role || "Draft"}
                    </Link>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{exp.view_count} views</span>
                      <span>{exp.sales_count} sales</span>
                      <span>
                        {formatUsdEarnings(convertInrToCurrency(exp.earnings_inr, "USD"))} verified
                        (USD)
                      </span>
                      {exp.result ? <Badge variant="outline">{VAULT_RESULT_LABELS[exp.result]}</Badge> : null}
                    </div>
                    {exp.published_at ? (
                      <VaultFreshness
                        lastConfirmedLabel={exp.last_confirmed_label}
                        stale={exp.stale}
                        staleLabel={exp.stale_label}
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {exp.published_at ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={confirmingId === exp.id}
                        onClick={() => void markGuideCurrent(exp.id)}
                      >
                        {confirmingId === exp.id ? "Updating…" : "Mark guide as current"}
                      </Button>
                    ) : null}
                    <Badge variant={exp.published_at ? "default" : "secondary"}>
                      {exp.published_at ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No experiences yet.{" "}
              <Link href="/interview-vault/sell" className="text-primary hover:underline">
                Create your first listing
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
