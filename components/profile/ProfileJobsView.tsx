"use client";

import PageHero from "@/components/design-system/PageHero";
import type { FeedDemoHint, JobPipelineCounts, RecommendedJobCard } from "@/lib/job-dashboard";
import ProfileJobDashboard from "./ProfileJobDashboard";
import RecommendedJobsSection from "./RecommendedJobsSection";

type Props = {
  jobs: RecommendedJobCard[];
  skillHints: string[];
  profileHeadline?: string | null;
  profileSummary?: string | null;
  feedKind: "live" | "demo";
  feedDemoHint?: FeedDemoHint | null;
  liveListings: number;
  matchedListings: number;
  jobPipeline: JobPipelineCounts;
  profileCompleteness: number;
  hasResume?: boolean;
  catalogUpdatedAt?: string | null;
  tailorHref?: string | null;
};

/** Jobs tab content — loaded on demand so Home and other routes stay fast. */
export default function ProfileJobsView({
  jobs,
  skillHints,
  profileHeadline,
  profileSummary,
  feedKind,
  feedDemoHint,
  liveListings,
  matchedListings,
  jobPipeline,
  profileCompleteness,
  hasResume = false,
  catalogUpdatedAt = null,
  tailorHref = null,
}: Props) {
  return (
    <div className="space-y-4">
      <PageHero
        title="Jobs"
        subtitle="Ranked by how your skills overlap each role."
      />
      <ProfileJobDashboard
        stats={jobPipeline}
        profileCompleteness={profileCompleteness}
        matchedListings={matchedListings}
        catalogUpdatedAt={catalogUpdatedAt}
      />
      <RecommendedJobsSection
        jobs={jobs}
        skillHints={skillHints}
        profileHeadline={profileHeadline}
        profileSummary={profileSummary}
        feedKind={feedKind}
        feedDemoHint={feedDemoHint}
        liveListings={liveListings}
        matchedListings={matchedListings}
        hasResume={hasResume}
        tailorHref={tailorHref}
      />
    </div>
  );
}
