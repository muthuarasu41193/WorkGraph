"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, Eye, RotateCcw } from "lucide-react";
import type { RecommendedJobCard } from "@/lib/job-dashboard";
import { readHiddenJobIds, restoreJob, restoreJobs } from "@/lib/hidden-jobs-storage";
import { useDashboardContext } from "@/components/dashboard/DashboardProvider";
import PageHeader from "@/components/design-system/PageHeader";
import { dashboardBreadcrumbs } from "@/lib/dashboard-routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { toast } from "@/hooks/use-toast";

export default function HiddenJobsSection() {
  const { userId, recommendedJobs } = useDashboardContext();
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setHiddenIds(readHiddenJobIds(userId));
  }, [userId]);

  const hiddenJobs = useMemo(
    () => recommendedJobs.filter((j) => hiddenIds.has(j.id)),
    [recommendedJobs, hiddenIds],
  );

  function handleRestore(job: RecommendedJobCard) {
    setHiddenIds(restoreJob(userId, job.id));
    toast({ title: "Job restored", description: `"${job.title}" is visible again in Jobs.`, variant: "success" });
  }

  function handleBulkRestore(jobs: RecommendedJobCard[]) {
    const next = restoreJobs(
      userId,
      jobs.map((j) => j.id),
    );
    setHiddenIds(next);
    toast({
      title: `${jobs.length} job${jobs.length === 1 ? "" : "s"} restored`,
      description: "Selected roles are visible again in Jobs.",
      variant: "success",
    });
  }

  const columns = useMemo<ColumnDef<RecommendedJobCard>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
        cell: ({ row }) => <span className="font-semibold">{row.original.title}</span>,
      },
      {
        accessorKey: "source",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Source" />,
        cell: ({ row }) => <Badge variant="outline">{row.original.source}</Badge>,
      },
      {
        accessorKey: "company",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />,
      },
      {
        accessorKey: "location",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Location" />,
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button type="button" variant="outline" size="sm" onClick={() => handleRestore(row.original)}>
              <RotateCcw className="h-4 w-4" />
              Restore
            </Button>
            {row.original.applyUrl ? (
              <Button asChild size="sm" variant="secondary">
                <a href={row.original.applyUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  View
                </a>
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [userId],
  );

  return (
    <section className="space-y-4" aria-labelledby="hidden-jobs-heading">
      <PageHeader
        breadcrumbs={dashboardBreadcrumbs("hidden-jobs")}
        title="Hidden Jobs"
        subtitle="Roles you dismissed from your feed. Restore any job to see it again under Jobs."
      />

      {hiddenJobs.length === 0 ? (
        <Card className="wg-dash-section-card border-dashed">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Eye className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No hidden jobs yet</p>
            <p className="mt-1 max-w-sm text-body text-muted-foreground">
              When browsing listings, use Hide on roles you are not interested in — they will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={hiddenJobs}
          getRowId={(row) => row.id}
          caption="Hidden jobs"
          filterPlaceholder="Search hidden jobs…"
          enableRowSelection
          bulkActions={(selected) => (
            <Button type="button" size="sm" onClick={() => handleBulkRestore(selected)}>
              <RotateCcw className="h-4 w-4" />
              Restore selected
            </Button>
          )}
          mobileCardRender={(job) => (
            <Card className="wg-dash-section-card">
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{job.title}</h2>
                    <Badge variant="outline">{job.source}</Badge>
                  </div>
                  <p className="text-body text-muted-foreground">
                    {job.company} · {job.location}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => handleRestore(job)}>
                    <RotateCcw className="h-4 w-4" />
                    Restore
                  </Button>
                  {job.applyUrl ? (
                    <Button asChild size="sm" variant="secondary">
                      <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        View
                      </a>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          )}
        />
      )}
    </section>
  );
}
