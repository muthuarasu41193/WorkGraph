"use client";

import { useState } from "react";
import { useWallet, useRequestPayout } from "../../hooks/use-wallet";
import { formatUsd } from "../../lib/utils";
import { useDashboardStore } from "../../stores/dashboard-store";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";

export default function WalletPanel() {
  const { data, isLoading, error } = useWallet();
  const payout = useRequestPayout();
  const dashboard = useDashboardStore((s) => s.dashboard);
  const [amount, setAmount] = useState("5.00");

  const balance = data?.balance_cents ?? 0;
  const pending = data?.pending_cents ?? 0;
  const lifetime = data?.lifetime_earned_cents ?? 0;

  async function onPayout(e: React.FormEvent) {
    e.preventDefault();
    const dollars = parseFloat(amount);
    if (Number.isNaN(dollars) || dollars < 5) return;
    await payout.mutateAsync(Math.round(dollars * 100));
  }

  return (
    <div className="space-y-5">
      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-body font-medium text-[var(--text-tertiary)]">Available</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-heading-l tabular-nums">{formatUsd(balance)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-body font-medium text-[var(--text-tertiary)]">Pending payout</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-heading-l tabular-nums">{formatUsd(pending)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-body font-medium text-[var(--text-tertiary)]">Lifetime earned</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-heading-l tabular-nums">{formatUsd(lifetime)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {dashboard ? (
        <p className="text-body text-[var(--text-secondary)]">
          Trust score {dashboard.trust_score} · Contribution score {dashboard.contribution_score}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Request payout</CardTitle>
          <CardDescription>Minimum $5.00 — reviewed by admin (self-hosted, no payment gateway required).</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" onSubmit={onPayout}>
            <div>
              <label className="mb-1 block text-caption font-medium text-[var(--text-tertiary)]">Amount (USD)</label>
              <Input
                type="number"
                min={5}
                step={0.01}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-32"
              />
            </div>
            <Button type="submit" disabled={payout.isPending || balance < 500}>
              {payout.isPending ? "Submitting…" : "Request payout"}
            </Button>
          </form>
          {payout.isError ? <p className="mt-2 text-body text-red-600">{(payout.error as Error).message}</p> : null}
          {payout.isSuccess ? (
            <p className="mt-2 text-body text-success-foreground">Payout request submitted.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="text-body text-red-600">Could not load wallet.</p> : null}
          <ul className="divide-y divide-[var(--border-default)]">
            {(data?.transactions ?? []).map((tx) => (
              <li key={tx.id} className="flex items-center justify-between py-3 text-body first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{tx.description ?? tx.kind}</p>
                  <p className="text-caption text-[var(--text-tertiary)]">
                    {tx.status} · {new Date(tx.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`tabular-nums font-semibold ${
                    tx.amount_cents >= 0 ? "text-success-foreground" : "text-[var(--text-primary)]"
                  }`}
                >
                  {tx.amount_cents >= 0 ? "+" : ""}
                  {formatUsd(Math.abs(tx.amount_cents))}
                </span>
              </li>
            ))}
          </ul>
          {!isLoading && !data?.transactions?.length ? (
            <p className="text-body text-[var(--text-tertiary)]">No transactions yet — publish community posts to earn.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
