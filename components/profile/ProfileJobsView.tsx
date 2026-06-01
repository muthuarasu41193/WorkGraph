"use client";

import type { FeedDemoHint, JobPipelineCounts, RecommendedJobCard } from "@/lib/job-dashboard";
import ProfileJobDashboard from "./ProfileJobDashboard";
import RecommendedJobsSection from "./RecommendedJobsSection";

type Props = {
  jobs: RecommendedJobCard[];
  skillHints: string[];
  feedKind: "live" | "demo";
  feedDemoHint?: FeedDemoHint | null;
  liveListings: number;
  listingsBySource: Partial<Record<string, number>>;
  jobPipeline: JobPipelineCounts;
  profileCompleteness: number;
};

/** Jobs tab content — loaded on demand so Home and other routes stay fast. */
export default function ProfileJobsView({
  jobs,
  skillHints,
  feedKind,
  feedDemoHint,
  liveListings,
  listingsBySource,
  jobPipeline,
  profileCompleteness,
}: Props) {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live listings ranked for your skills and experience.
        </p>
      </header>
      <ProfileJobDashboard
        stats={jobPipeline}
        profileCompleteness={profileCompleteness}
        liveListings={liveListings}
        listingsBySource={listingsBySource}
      />
      <RecommendedJobsSection
        jobs={jobs}
        skillHints={skillHints}
        feedKind={feedKind}
        feedDemoHint={feedDemoHint}
        liveListings={liveListings}
      />
    </div>
  );
}
