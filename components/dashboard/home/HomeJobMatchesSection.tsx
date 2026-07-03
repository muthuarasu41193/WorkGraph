import Link from "next/link";
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/design-system/EmptyState";
import JobCard, { jobCardFromMatch } from "@/components/design-system/JobCard";
import SectionHeader from "@/components/design-system/SectionHeader";
import type { JobMatchPreviewExt } from "@/lib/home-dashboard";
import { dashboardHref } from "@/lib/dashboard-routes";

export default function HomeJobMatchesSection({
  jobs,
  feedKind,
}: {
  jobs: JobMatchPreviewExt[];
  feedKind: "live" | "demo";
}) {
  return (
    <section className="space-y-4" aria-labelledby="home-matches-heading">
      <SectionHeader
        title="Recommended Jobs"
        description={`Top roles ranked by AI match score${feedKind === "live" ? " · live catalog" : ""}.`}
        action={
          <Button asChild variant="outline" size="sm" className="wg-dash-compact-btn">
            <Link href={dashboardHref("jobs")}>View all jobs</Link>
          </Button>
        }
      />

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
        <ul className="space-y-3">
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
