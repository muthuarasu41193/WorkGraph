import Link from "next/link";
import { ArrowRight, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/design-system/EmptyState";
import JobCard, { JobCardSkeleton } from "@/components/design-system/JobCard";
import "@/components/design-system/job-card.css";
import { jobCardFromMatch } from "@/lib/job-card-data";
import type { JobMatchPreviewExt } from "@/lib/home-dashboard";
import { dashboardHref } from "@/lib/dashboard-routes";

export function HomeJobMatchesSkeleton() {
  return (
    <section className="space-y-4" aria-busy="true" aria-label="Loading recommended jobs">
      <div className="space-y-1.5">
        <div className="h-7 w-48 rounded wg-skeleton-shimmer" />
        <div className="h-3.5 w-64 max-w-full rounded wg-skeleton-shimmer" />
      </div>
      <ul className="job-list">
        {Array.from({ length: 5 }).map((_, index) => (
          <li key={index}>
            <JobCardSkeleton />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function HomeJobMatchesSection({
  jobs,
  feedKind,
}: {
  jobs: JobMatchPreviewExt[];
  feedKind: "live" | "demo";
}) {
  return (
    <section className="space-y-4" aria-labelledby="home-matches-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="home-matches-heading"
            className="text-xl font-semibold tracking-tight text-slate-900"
          >
            Recommended Jobs
          </h2>
          <p className="mt-0.5 text-[13px] text-slate-500">
            {`Top roles ranked by AI match score${feedKind === "live" ? " · live catalog" : ""}.`}
          </p>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="wg-touch-target text-red-600 hover:bg-red-50 hover:text-red-700 enabled:hover:scale-100"
        >
          <Link href={dashboardHref("jobs")}>
            View all jobs
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No matches yet"
          description="Add skills or upload your resume to unlock AI-ranked job matches."
          action={
            <Button asChild size="sm">
              <Link href={dashboardHref("profile")}>Complete profile</Link>
            </Button>
          }
        />
      ) : (
        <ul className="job-list">
          {jobs.slice(0, 5).map((job, index) => (
            <li key={job.id}>
              <JobCard job={jobCardFromMatch(job)} index={index} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
