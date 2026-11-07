import { Suspense } from "react";
import type { JobMatchPreviewExt } from "@/lib/home-dashboard";
import HomeDashboardSkeleton from "@/components/dashboard/home/HomeDashboardSkeleton";
import HomeHiddenJobsFeed from "@/components/dashboard/home/HomeHiddenJobsFeed";
import HomeJobMatchesSection from "@/components/dashboard/home/HomeJobMatchesSection";
import HomeStatCards from "@/components/dashboard/home/HomeStatCards";
import HomeWelcomeHeader from "@/components/dashboard/home/HomeWelcomeHeader";
import {
  buildHomeDashboardData,
  countApplicationsThisWeek,
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
  /** Catalog jobs matched to profile — same source as Jobs tab `matchedListings`. */
  matchedListings: number;
  feedKind: "live" | "demo";
};

function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-[var(--layout-card-gap)] sm:grid-cols-3" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-card)] border border-hairline bg-surface-raised p-[var(--layout-card-pad-mobile)] md:p-[var(--layout-card-pad)]"
        >
          <div className="h-8 w-8 rounded-md wg-skeleton-shimmer" />
          <div className="flex flex-col gap-[var(--space-1)]">
            <div className="h-3.5 w-24 rounded wg-skeleton-shimmer" />
            <div className="h-8 w-14 rounded wg-skeleton-shimmer" />
            <div className="h-3.5 w-40 max-w-full rounded wg-skeleton-shimmer" />
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
  const applicationsPromise = supabaseConfigured()
    ? listApplicationsForUser().catch(() => [])
    : Promise.resolve([]);
  const [hidden, wallet, vaultHome, applications] = await Promise.all([
    loadHiddenJobsFeed(5),
    loadWalletSnapshot(),
    vaultHomePromise,
    applicationsPromise,
  ]);
  const followUpsDue = countFollowUpsNeedingAttention(applications);
  const applicationsThisWeek = countApplicationsThisWeek(applications);
  const data = buildHomeDashboardData({
    profile: props.profile,
    recommendedJobs: props.recommendedJobs,
    semanticJobMatches: props.semanticJobMatches,
    jobPipeline: props.jobPipeline,
    matchedListings: props.matchedListings,
    feedKind: props.feedKind,
    hiddenFeed: hidden.items,
    hiddenTotal: hidden.total,
    wallet,
    vaultEarningsInr: vaultHome.earningsInr,
    followUpsDue,
    applicationsThisWeek,
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

  return (
    <div className="flex flex-col gap-[var(--layout-section-gap)]">
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
    </div>
  );
}
