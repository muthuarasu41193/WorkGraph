import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MetricsFunnelChart } from "@/components/admin/MetricsFunnelChart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSessionUser } from "@/lib/auth/session-server";
import { PRODUCT_EVENT_NAMES } from "@/lib/metrics/events";
import { resolveAdminMetricsAccess } from "@/lib/metrics/admin";
import { loadMetricsSnapshot } from "@/lib/metrics/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Founder metrics",
  robots: { index: false, follow: false },
};

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminMetricsPage() {
  const user = await getSessionUser();
  if (resolveAdminMetricsAccess(user?.email) !== "ok") {
    notFound();
  }

  const snapshot = await loadMetricsSnapshot();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8 space-y-2">
        <p className="text-role-caption text-fg-secondary">Admin · first-party only</p>
        <h1 className="text-role-heading text-fg-primary">Product metrics</h1>
        <p className="max-w-2xl text-role-body text-fg-secondary">
          Funnel counts from server events. No third-party analytics. Props never store emails,
          names, or resume text.
        </p>
      </header>

      <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Revenue and passes">
        <MetricTile label="Revenue · 7 days" value={formatInr(snapshot.revenueInr7)} />
        <MetricTile label="Revenue · 30 days" value={formatInr(snapshot.revenueInr30)} />
        <MetricTile label="Revenue · all paid" value={formatInr(snapshot.revenueInrAll)} />
        <MetricTile label="Active passes" value={String(snapshot.activePasses)} />
      </section>

      <section className="mb-10 space-y-3" aria-labelledby="funnel-heading">
        <h2 id="funnel-heading" className="text-role-title text-fg-primary">
          Funnel
        </h2>
        <p className="text-role-body-small text-fg-secondary">
          Signup → resume → tailoring → checkout → purchase (event counts, not unique users).
        </p>
        <div className="rounded-control border border-hairline bg-surface-raised p-4">
          <MetricsFunnelChart
            data={snapshot.funnel.map((row) => ({
              stage: row.stage,
              d7: row.d7,
              d30: row.d30,
            }))}
          />
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="events-heading">
        <h2 id="events-heading" className="text-role-title text-fg-primary">
          Event counts
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>7 days</TableHead>
              <TableHead>30 days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PRODUCT_EVENT_NAMES.map((event) => (
              <TableRow key={event}>
                <TableCell className="font-medium text-fg-primary">{event}</TableCell>
                <TableCell>{snapshot.events[event].d7}</TableCell>
                <TableCell>{snapshot.events[event].d30}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-role-caption text-fg-secondary">
          Paid Pass checkouts in window: {snapshot.paidPassCount7} (7d) · {snapshot.paidPassCount30}{" "}
          (30d).
        </p>
      </section>
    </main>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control border border-hairline bg-surface-raised p-4">
      <p className="text-role-caption text-fg-secondary">{label}</p>
      <p className="mt-1 text-role-title text-fg-primary">{value}</p>
    </div>
  );
}
