"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Eye, RotateCcw } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import type { RecommendedJobCard } from "@/lib/job-dashboard";
import { readHiddenJobIds, restoreJob } from "@/lib/hidden-jobs-storage";
import { useDashboardContext } from "@/components/dashboard/DashboardProvider";
import EmptyState from "@/components/design-system/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { dashboardHref } from "@/lib/dashboard-routes";

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

  return (
    <section className="space-y-3" aria-labelledby="hidden-jobs-heading">
      <header>
        <h1 id="hidden-jobs-heading" className="text-xl font-semibold tracking-tight text-fg-primary">
          Hidden Jobs
        </h1>
        <p className="mt-0.5 text-[13px] text-fg-secondary">
          Roles you dismissed from your feed. Restore any job to see it again under Jobs.
        </p>
      </header>

      {hiddenJobs.length === 0 ? (
        <EmptyState
          icon={Eye}
          title="No hidden jobs yet"
          description="When browsing listings, use Hide on roles you are not interested in — they will appear here."
          action={
            <Button asChild size="sm">
              <Link href={dashboardHref("jobs")}>Browse jobs</Link>
            </Button>
          }
        />
      ) : (
        <ul className="overflow-hidden rounded-[10px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {hiddenJobs.map((job) => (
            <li key={job.id} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
              <div className="flex flex-col gap-2 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h2 className="text-[14px] font-semibold tracking-tight text-fg-primary">{job.title}</h2>
                      <Badge variant="outline" className="h-5 px-1.5 text-[11px]">{job.source}</Badge>
                    </div>
                    <p className="text-[12.5px] text-fg-secondary">
                      {job.company} · {job.location}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => handleRestore(job)}>
                      <RotateCcw className={iconClass()} />
                      Restore
                    </Button>
                    {job.applyUrl ? (
                      <Button asChild size="sm" variant="secondary">
                        <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className={iconClass()} />
                          View
                        </a>
                      </Button>
                    ) : null}
                  </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
