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
  jobPipeline: JobPipelineCounts;
  profileCompleteness: number;
  hasResume?: boolean;
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
  jobPipeline,
  profileCompleteness,
  hasResume = false,
}: Props) {
  return (
    <div className="space-y-6">
      <PageHero
        title="Job Discovery"
        subtitle="Browse live listings ranked by AI match score for your skills and experience."
      />
      <ProfileJobDashboard
        stats={jobPipeline}
        profileCompleteness={profileCompleteness}
        liveListings={liveListings}
      />
      <RecommendedJobsSection
        jobs={jobs}
        skillHints={skillHints}
        profileHeadline={profileHeadline}
        profileSummary={profileSummary}
        feedKind={feedKind}
        feedDemoHint={feedDemoHint}
        liveListings={liveListings}
        hasResume={hasResume}
      />
    </div>
  );
}
