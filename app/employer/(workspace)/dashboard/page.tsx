"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { LayoutDashboard, Radio } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { EmployerProfile, HiringSignal } from "@/lib/employer/types";
import { HIRING_INTENT_LABELS } from "@/lib/employer/types";
import PulseInbox from "@/components/employer/PulseInbox";
import VerificationBanner from "@/components/employer/VerificationBanner";
import PageHeader from "@/components/design-system/PageHeader";
import { AppShell } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";

export default function EmployerDashboardPage() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const [signals, setSignals] = useState<HiringSignal[]>([]);
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const columns = useMemo<ColumnDef<HiringSignal>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Signal" />,
        cell: ({ row }) => (
          <Link
            href={`/employer/signals/${row.original.id}`}
            className="font-medium hover:text-[var(--accent)]"
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        accessorKey: "hiring_intent",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Intent" />,
        cell: ({ row }) => HIRING_INTENT_LABELS[row.original.hiring_intent],
      },
      {
        accessorKey: "applies_count",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Connections" />,
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.applies_count}</span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => (
          <Badge variant={row.original.status === "live" ? "default" : "secondary"}>
            {row.original.status}
          </Badge>
        ),
      },
    ],
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sigRes, profRes] = await Promise.all([
        fetch("/api/employer/signals"),
        fetch("/api/employer/profile"),
      ]);
      const sigData = (await sigRes.json()) as { ok?: boolean; signals?: HiringSignal[] };
      const profData = (await profRes.json()) as { ok?: boolean; profile?: EmployerProfile | null };
      if (sigData.ok) setSignals(sigData.signals ?? []);
      if (profData.ok && profData.profile) setEmployerProfile(profData.profile);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (tab === "inbox") {
    return (
      <AppShell.Page>
        <PageHeader
          pinned
          breadcrumbs={[
            { label: "Employer", href: "/employer/dashboard" },
            { label: "Pulse inbox" },
          ]}
          title="Pulse inbox"
          subtitle="Review applicant resumes, links, and profile details — click a card for the full application."
        />
        <AppShell.Content constrained={false}>
          <PulseInbox />
        </AppShell.Content>
      </AppShell.Page>
    );
  }

  return (
    <AppShell.Page>
      <PageHeader
        pinned
        breadcrumbs={[
          { label: "Employer", href: "/employer/dashboard" },
          { label: "Hiring signals" },
        ]}
        icon={<LayoutDashboard aria-hidden />}
        title="Hiring signals"
        subtitle="Live signals appear in WorkGraph Direct for jobseekers."
        primaryAction={
          <Button asChild>
            <Link href="/employer/signals/new">
              <Radio className="mr-2 h-4 w-4" />
              New signal
            </Link>
          </Button>
        }
      />

      <AppShell.Content constrained={false} className="space-y-6">
        {employerProfile ? (
          <VerificationBanner profile={employerProfile} onUpdated={setEmployerProfile} />
        ) : null}

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" className="text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={signals}
            getRowId={(row) => row.id}
            caption="Employer hiring signals"
            filterPlaceholder="Search signals…"
            loading={loading}
            emptyState={{
              title: "No signals yet",
              description: "Post your first hiring signal to reach jobseekers on WorkGraph Direct.",
              action: (
                <Button asChild>
                  <Link href="/employer/signals/new">Post your first hiring signal</Link>
                </Button>
              ),
            }}
            mobileCardRender={(signal) => (
              <Card>
                <CardContent className="flex items-start justify-between gap-2 p-4">
                  <div>
                    <Link
                      href={`/employer/signals/${signal.id}`}
                      className="font-semibold hover:text-[var(--accent)]"
                    >
                      {signal.title}
                    </Link>
                    <p className="mt-1 text-caption text-muted-foreground">
                      {HIRING_INTENT_LABELS[signal.hiring_intent]} · {signal.applies_count} connection
                      {signal.applies_count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Badge variant={signal.status === "live" ? "default" : "secondary"}>{signal.status}</Badge>
                </CardContent>
              </Card>
            )}
          />
        )}
      </AppShell.Content>
    </AppShell.Page>
  );
}
