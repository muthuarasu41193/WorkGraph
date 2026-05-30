import type { FeedDemoHint, JobPipelineCounts, RecommendedJobCard } from "@/lib/job-dashboard";
import type { Profile } from "@/lib/types";
import type { JobMatchPreviewExt } from "@/components/profile/premium/job-match-utils";

export type DashboardContextValue = {
  profile: Profile;
  userId: string;
  recommendedJobs: RecommendedJobCard[];
  communityPosts: RecommendedJobCard[];
  semanticJobMatches: JobMatchPreviewExt[] | null;
  jobPipeline: JobPipelineCounts;
  liveListings: number;
  listingsBySource: Partial<Record<string, number>>;
  feedKind: "live" | "demo";
  feedDemoHint?: FeedDemoHint | null;
};
