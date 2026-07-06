"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, ShoppingBag, Wallet } from "lucide-react";
import VaultEarningsChart from "@/components/vault/VaultEarningsChart";
import PageHeader from "@/components/design-system/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { toast } from "@/hooks/use-toast";
import { convertInrToCurrency, formatCurrencyAmount, type SupportedCurrency } from "@/lib/currency";
import { VAULT_RESULT_LABELS, type VaultDashboardStats } from "@/lib/vault";

type ExperienceRow = VaultDashboardStats["experiences"][number];

type Props = {
  dashboard: VaultDashboardStats;
  currency: SupportedCurrency;
};

export default function VaultDashboard({ dashboard, currency }: Props) {
  const [withdrawing, setWithdrawing] = useState(false);
  const totalEarningsDisplay = convertInrToCurrency(dashboard.total_earnings_inr, currency);

  const columns = useMemo<ColumnDef<ExperienceRow>[]>(
    () => [
      {
        accessorKey: "company",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Experience" />,
        cell: ({ row }) => (
          <Link href={`/interview-vault/${row.original.id}`} className="font-medium hover:text-primary">
            {row.original.company || "Untitled"} — {row.original.role || "Draft"}
          </Link>
        ),
      },
      {
        accessorKey: "view_count",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Views" />,
        cell: ({ row }) => <span className="tabular-nums">{row.original.view_count.toLocaleString("en-IN")}</span>,
      },
      {
        accessorKey: "sales_count",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Sales" />,
        cell: ({ row }) => <span className="tabular-nums">{row.original.sales_count.toLocaleString("en-IN")}</span>,
      },
      {
        accessorKey: "earnings_inr",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Earned" />,
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatCurrencyAmount(convertInrToCurrency(row.original.earnings_inr, currency), currency)}
          </span>
        ),
      },
      {
        id: "result",
        accessorFn: (row) => row.result ?? "",
        header: "Result",
        cell: ({ row }) =>
          row.original.result ? (
            <Badge variant="outline">{VAULT_RESULT_LABELS[row.original.result]}</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        enableSorting: false,
      },
      {
        id: "status",
        accessorFn: (row) => (row.published_at ? "Published" : "Draft"),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => (
          <Badge variant={row.original.published_at ? "default" : "secondary"}>
            {row.original.published_at ? "Published" : "Draft"}
          </Badge>
        ),
      },
    ],
    [currency],
  );

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
      <PageHeader
        sticky={false}
        padding={false}
        breadcrumbs={[
          { label: "Interview Vault", href: "/interview-vault" },
          { label: "Seller dashboard" },
        ]}
        title="Seller Dashboard"
        subtitle="Track earnings, views, and manage your published experiences."
        metrics={stats.map(({ label, value }) => ({ label, value }))}
        primaryAction={
          <Button variant="outline" asChild>
            <Link href="/interview-vault/sell">+ New experience</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-heading-s">Sales over time</CardTitle>
        </CardHeader>
        <CardContent>
          <VaultEarningsChart salesByDay={dashboard.sales_by_day} currency={currency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-heading-s">Your experiences</CardTitle>
          <Button onClick={() => void requestWithdrawal()} disabled={withdrawing || dashboard.total_earnings_inr < 500}>
            <Wallet className="h-4 w-4" />
            {withdrawing ? "Submitting…" : "Request withdrawal"}
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={dashboard.experiences}
            getRowId={(row) => row.id}
            caption="Seller experiences"
            filterPlaceholder="Search experiences…"
            initialSorting={[{ id: "earnings_inr", desc: true }]}
            emptyState={{
              title: "No experiences yet",
              description: "Create your first listing to start selling interview experiences.",
              action: (
                <Button asChild>
                  <Link href="/interview-vault/sell">Create your first listing</Link>
                </Button>
              ),
            }}
            mobileCardRender={(exp) => (
              <div className="rounded-xl border p-4">
                <Link href={`/interview-vault/${exp.id}`} className="font-medium hover:text-primary">
                  {exp.company || "Untitled"} — {exp.role || "Draft"}
                </Link>
                <div className="mt-2 flex flex-wrap gap-2 text-caption text-muted-foreground">
                  <span>{exp.view_count} views</span>
                  <span>{exp.sales_count} sales</span>
                  <span>
                    {formatCurrencyAmount(convertInrToCurrency(exp.earnings_inr, currency), currency)} earned
                  </span>
                </div>
                <Badge className="mt-2" variant={exp.published_at ? "default" : "secondary"}>
                  {exp.published_at ? "Published" : "Draft"}
                </Badge>
              </div>
            )}
          />
          {dashboard.total_earnings_inr > 0 && dashboard.total_earnings_inr < 500 ? (
            <p className="mt-3 text-caption text-muted-foreground">
              Minimum withdrawal amount is ₹500 ({formatCurrencyAmount(convertInrToCurrency(500, currency), currency)}).
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
