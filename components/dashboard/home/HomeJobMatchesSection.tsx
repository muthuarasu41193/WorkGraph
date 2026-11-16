import { Briefcase } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/design-system/EmptyState";
import JobCard, { JobCardSkeleton } from "@/components/design-system/JobCard";
import "@/components/design-system/job-card.css";
import { Section } from "@/components/ui/section";
import { jobCardFromMatch } from "@/lib/job-card-data";
import type { JobMatchPreviewExt } from "@/lib/home-dashboard";
import { dashboardHref } from "@/lib/dashboard-routes";

export function HomeJobMatchesSkeleton() {
  return (
    <section className="flex flex-col gap-[var(--layout-section-title-gap)]" aria-busy="true" aria-label="Loading recommended jobs">
      <div className="flex flex-col gap-[var(--layout-stack-tight)]">
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
  feedKind: _feedKind,
}: {
  jobs: JobMatchPreviewExt[];
  feedKind: "live" | "demo";
}) {
  return (
    <Section
      titleId="home-matches-heading"
      title="Recommended Jobs"
      description="Top roles ranked by skill overlap with your profile."
      action={{ href: dashboardHref("jobs"), label: "View all jobs" }}
    >
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
    </Section>
  );
}
