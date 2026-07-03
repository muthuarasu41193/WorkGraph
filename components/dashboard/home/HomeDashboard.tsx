import { Suspense } from "react";
import type { JobMatchPreviewExt } from "@/lib/home-dashboard";
import HomeDashboardSkeleton from "@/components/dashboard/home/HomeDashboardSkeleton";
import HomeHiddenJobsFeed from "@/components/dashboard/home/HomeHiddenJobsFeed";
import HomeJobMatchesSection from "@/components/dashboard/home/HomeJobMatchesSection";
import HomeStatCards from "@/components/dashboard/home/HomeStatCards";
import HomeWelcomeHeader from "@/components/dashboard/home/HomeWelcomeHeader";
import HomeIntelligenceGrid from "@/components/dashboard/home/HomeIntelligenceGrid";
import HomeChartsSection from "@/components/dashboard/home/HomeChartsSection";
import HomeActivitySection from "@/components/dashboard/home/HomeActivitySection";
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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
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
      <HomeIntelligenceGrid />
      <HomeJobMatchesSection jobs={data.topMatches} feedKind={data.feedKind} />
    </>
  );
}

export default function HomeDashboard(props: HomeDashboardProps) {
  const greeting = getTimeGreeting();
  const displayName = getProfileFirstName(props.profile);

  return (
    <div className="space-y-8">
      <HomeWelcomeHeader
        greeting={greeting}
        displayName={displayName}
        newMatches={props.semanticJobMatches?.length ?? props.recommendedJobs.length}
        hiddenJobs={11}
        resumeScore={91}
        applicationScore={64}
        careerHealth={82}
      />

      <Suspense fallback={<StatCardsSkeleton />}>
        <HomeStatsAndMatches {...props} />
      </Suspense>

      <HomeChartsSection />
      <HomeActivitySection />

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
