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
import { listApplicationsForUser } from "@/lib/applications-server";
import { countFollowUpsNeedingAttention } from "@/lib/applications-followup";
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
    <div className="grid grid-cols-1 gap-[var(--layout-card-gap)] md:grid-cols-2" aria-hidden>
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-surface-raised p-[var(--layout-card-pad-mobile)] md:p-[var(--layout-card-pad)]"
        >
          <span className="absolute inset-y-0 left-0 w-0.5 bg-accent" />
          <div className="h-10 w-10 rounded-[var(--radius-control)] wg-skeleton-shimmer" />
          <div className="mt-[var(--space-3)] flex flex-col gap-[var(--layout-stack-tight)]">
            <div className="h-4 w-36 rounded wg-skeleton-shimmer" />
            <div className="h-3.5 w-48 max-w-full rounded wg-skeleton-shimmer" />
            <div className="h-7 w-12 rounded wg-skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function HomeStatsAndMatches(props: HomeDashboardProps) {
  const vaultHomePromise = supabaseConfigured()
    ? getVaultHomeStats(props.profile.id)
    : Promise.resolve({ views: 0, earningsInr: 0, rating: 0, ratingCount: 0 });
  const followUpsPromise = supabaseConfigured()
    ? listApplicationsForUser()
        .then((apps) => countFollowUpsNeedingAttention(apps))
        .catch(() => 0)
    : Promise.resolve(0);
  const [hidden, wallet, vaultHome, followUpsDue] = await Promise.all([
    loadHiddenJobsFeed(5),
    loadWalletSnapshot(),
    vaultHomePromise,
    followUpsPromise,
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
    followUpsDue,
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
    <div className="flex flex-col gap-[var(--layout-section-gap)]">
      <HomeWelcomeHeader
        greeting={greeting}
        displayName={displayName}
        newMatches={newMatches > 0 ? newMatches : undefined}
      />

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
    </div>
  );
}
