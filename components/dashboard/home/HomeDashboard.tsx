import { Suspense } from "react";
import type { JobMatchPreviewExt } from "@/lib/home-dashboard";
import HomeDashboardSkeleton from "@/components/dashboard/home/HomeDashboardSkeleton";
import HomeHiddenJobsFeed from "@/components/dashboard/home/HomeHiddenJobsFeed";
import HomeJobMatchesSection, {
  HomeJobMatchesSkeleton,
} from "@/components/dashboard/home/HomeJobMatchesSection";
import HomeStatCards from "@/components/dashboard/home/HomeStatCards";
import HomeWelcomeHeader from "@/components/dashboard/home/HomeWelcomeHeader";
import {
  buildHomeDashboardData,
  getProfileFirstName,
  getTimeGreeting,
  loadHiddenJobsFeed,
  loadWalletSnapshot,
} from "@/lib/home-dashboard";
import type { JobPipelineCounts, RecommendedJobCard } from "@/lib/job-dashboard";
import type { Profile } from "@/lib/types";
import { getVaultHomeStats } from "@/lib/vault-server";
import { supabaseConfigured } from "@/lib/supabase-enabled";

export type HomeDashboardProps = {
  profile: Profile;
  recommendedJobs: RecommendedJobCard[];
  semanticJobMatches: JobMatchPreviewExt[] | null;
  jobPipeline: JobPipelineCounts;
  feedKind: "live" | "demo";
};

function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-hidden>
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-[12px] border border-slate-200 bg-white p-5"
        >
          <span className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-red-600 to-red-400" />
          <div className="h-10 w-10 rounded-lg wg-skeleton-shimmer" />
          <div className="mt-3 space-y-2">
            <div className="h-4 w-36 rounded wg-skeleton-shimmer" />
            <div className="h-3.5 w-48 max-w-full rounded wg-skeleton-shimmer" />
            <div className="h-7 w-12 rounded wg-skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsAndMatchesSkeleton() {
  return (
    <>
      <StatCardsSkeleton />
      <HomeJobMatchesSkeleton />
    </>
  );
}

async function HomeStatsAndMatches(props: HomeDashboardProps) {
  const vaultHomePromise = supabaseConfigured()
    ? getVaultHomeStats(props.profile.id)
    : Promise.resolve({ views: 0, earningsInr: 0, rating: 0, ratingCount: 0 });
  const [hidden, wallet, vaultHome] = await Promise.all([
    loadHiddenJobsFeed(5),
    loadWalletSnapshot(),
    vaultHomePromise,
  ]);
  const data = buildHomeDashboardData({
    profile: props.profile,
    recommendedJobs: props.recommendedJobs,
    semanticJobMatches: props.semanticJobMatches,
    jobPipeline: props.jobPipeline,
    feedKind: props.feedKind,
    hiddenFeed: hidden.items,
    hiddenTotal: hidden.total,
    wallet,
    vaultEarningsInr: vaultHome.earningsInr,
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
  const newMatches = props.semanticJobMatches?.length ?? props.recommendedJobs.length;

  return (
    <div className="space-y-8">
      <HomeWelcomeHeader
        greeting={greeting}
        displayName={displayName}
        newMatches={newMatches > 0 ? newMatches : undefined}
      />

      <Suspense fallback={<StatsAndMatchesSkeleton />}>
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
    </div>
  );
}
