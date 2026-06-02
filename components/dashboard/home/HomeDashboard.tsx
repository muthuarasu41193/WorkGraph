import { Suspense } from "react";
import type { JobMatchPreviewExt } from "@/lib/home-dashboard";
import HomeDashboardSkeleton from "@/components/dashboard/home/HomeDashboardSkeleton";
import HomeHiddenJobsFeed from "@/components/dashboard/home/HomeHiddenJobsFeed";
import HomeJobMarketPulse from "@/components/dashboard/home/HomeJobMarketPulse";
import HomeJobMatchesSection from "@/components/dashboard/home/HomeJobMatchesSection";
import HomeStatCards from "@/components/dashboard/home/HomeStatCards";
import HomeVaultStatsSection from "@/components/dashboard/home/HomeVaultStatsSection";
import HomeWelcomeHeader from "@/components/dashboard/home/HomeWelcomeHeader";
import {
  buildHomeDashboardData,
  buildJobMarketPulse,
  getProfileFirstName,
  getTimeGreeting,
  loadHiddenJobsFeed,
  loadWalletSnapshot,
} from "@/lib/home-dashboard";
import type { JobPipelineCounts, RecommendedJobCard } from "@/lib/job-dashboard";
import type { Profile } from "@/lib/types";

export type HomeDashboardProps = {
  profile: Profile;
  recommendedJobs: RecommendedJobCard[];
  semanticJobMatches: JobMatchPreviewExt[] | null;
  jobPipeline: JobPipelineCounts;
  feedKind: "live" | "demo";
};

function StatCardsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

async function HomeStatsAndMatches(props: HomeDashboardProps) {
  const [hidden, wallet] = await Promise.all([loadHiddenJobsFeed(5), loadWalletSnapshot()]);
  const data = buildHomeDashboardData({
    profile: props.profile,
    recommendedJobs: props.recommendedJobs,
    semanticJobMatches: props.semanticJobMatches,
    jobPipeline: props.jobPipeline,
    feedKind: props.feedKind,
    hiddenFeed: hidden.items,
    hiddenTotal: hidden.total,
    wallet,
  });

  return (
    <>
      <HomeStatCards stats={data.stats} />
      <HomeJobMatchesSection jobs={data.topMatches} feedKind={data.feedKind} />
    </>
  );
}

export default function HomeDashboard(props: HomeDashboardProps) {
  const greeting = getTimeGreeting();
  const displayName = getProfileFirstName(props.profile);
  const pulse = buildJobMarketPulse(props.profile, props.recommendedJobs);

  return (
    <div className="space-y-6">
      <HomeWelcomeHeader greeting={greeting} displayName={displayName} />

      <Suspense fallback={<StatCardsSkeleton />}>
        <HomeStatsAndMatches {...props} />
      </Suspense>

      <Suspense
        fallback={
          <section aria-label="Loading hidden jobs feed">
            <HomeDashboardSkeleton />
          </section>
        }
      >
        <HomeHiddenJobsFeed />
      </Suspense>

      <Suspense
        fallback={
          <section aria-label="Loading vault stats">
            <HomeDashboardSkeleton />
          </section>
        }
      >
        <HomeVaultStatsSection />
      </Suspense>

      <HomeJobMarketPulse pulse={pulse} />
    </div>
  );
}
