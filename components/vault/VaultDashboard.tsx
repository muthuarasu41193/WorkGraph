"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, ShoppingBag, Wallet } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import VaultEarningsChart from "@/components/vault/VaultEarningsChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { convertInrToCurrency, formatCurrencyAmount, type SupportedCurrency } from "@/lib/currency";
import { VAULT_RESULT_LABELS, type VaultDashboardStats } from "@/lib/vault";

type Props = {
  dashboard: VaultDashboardStats;
  currency: SupportedCurrency;
};

export default function VaultDashboard({ dashboard, currency }: Props) {
  const [withdrawing, setWithdrawing] = useState(false);
  const totalEarningsDisplay = convertInrToCurrency(dashboard.total_earnings_inr, currency);

  async function requestWithdrawal() {
    setWithdrawing(true);
    try {
      const res = await fetch("/api/vault/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "withdraw" }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Withdrawal failed");
      toast({ title: "Withdrawal requested", description: data.message, variant: "success" });
    } catch (err) {
      toast({
        title: "Withdrawal failed",
        description: err instanceof Error ? err.message : "Could not request withdrawal",
        variant: "error",
      });
    } finally {
      setWithdrawing(false);
    }
  }

  const stats = [
    {
      label: "Total earnings",
      value: formatCurrencyAmount(totalEarningsDisplay, currency),
      icon: Wallet,
    },
    { label: "Total views", value: dashboard.total_views.toLocaleString("en-IN"), icon: Eye },
    { label: "Total sales", value: dashboard.total_sales.toLocaleString("en-IN"), icon: ShoppingBag },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Seller Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track earnings, views, and manage your published experiences.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/interview-vault/sell">+ New experience</Link>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sales over time</CardTitle>
        </CardHeader>
        <CardContent>
          <VaultEarningsChart salesByDay={dashboard.sales_by_day} currency={currency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Your experiences</CardTitle>
          <Button onClick={() => void requestWithdrawal()} disabled={withdrawing || dashboard.total_earnings_inr < 500}>
            <Wallet className={iconClass()} />
            {withdrawing ? "Submitting…" : "Request withdrawal"}
          </Button>
        </CardHeader>
        <CardContent>
          {dashboard.experiences.length > 0 ? (
            <ul className="divide-y">
              {dashboard.experiences.map((exp) => (
                <li key={exp.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <Link href={`/interview-vault/${exp.id}`} className="font-medium hover:text-primary">
                      {exp.company || "Untitled"} — {exp.role || "Draft"}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{exp.view_count} views</span>
                      <span>{exp.sales_count} sales</span>
                      <span>{formatCurrencyAmount(convertInrToCurrency(exp.earnings_inr, currency), currency)} earned</span>
                      {exp.result ? <Badge variant="outline">{VAULT_RESULT_LABELS[exp.result]}</Badge> : null}
                    </div>
                  </div>
                  <Badge variant={exp.published_at ? "default" : "secondary"}>
                    {exp.published_at ? "Published" : "Draft"}
                  </Badge>
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
          {dashboard.total_earnings_inr > 0 && dashboard.total_earnings_inr < 500 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Minimum withdrawal amount is ₹500 ({formatCurrencyAmount(convertInrToCurrency(500, currency), currency)}).
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
