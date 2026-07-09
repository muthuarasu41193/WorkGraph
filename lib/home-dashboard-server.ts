import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/session-server";
import { loadProfileJobDashboard } from "@/lib/job-dashboard";
import type { JobMatchPreviewExt } from "@/lib/home-dashboard";
import { loadUserProfile } from "@/lib/load-profile";
import { loadSemanticJobMatches } from "@/lib/workgraph-dashboard";
import { supabaseConfigured } from "@/lib/supabase-enabled";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { JobPipelineCounts, RecommendedJobCard } from "@/lib/job-dashboard";
import type { Profile } from "@/lib/types";

export type HomeDashboardPageProps = {
  profile: Profile;
  recommendedJobs: RecommendedJobCard[];
  semanticJobMatches: JobMatchPreviewExt[] | null;
  jobPipeline: JobPipelineCounts;
  feedKind: "live" | "demo";
};

export type HomeDashboardLoadResult =
  | { redirectTo: string }
  | HomeDashboardPageProps;

export async function loadHomeDashboardPageProps(): Promise<HomeDashboardLoadResult> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return { redirectTo: "/login?next=/profile" };

  const profile = await loadUserProfile(sessionUser.id);
  if (!profile) return { redirectTo: "/create-profile" };

  let jobDashboard: Awaited<ReturnType<typeof loadProfileJobDashboard>> = {
    pipeline: { applied: 0, interview: 0, offers: 0, saved: 0 },
    recommended: [],
    communityPosts: [],
    liveListings: 0,
    matchedListings: 0,
    listingsBySource: {},
    feedKind: "live",
    feedDemoHint: "empty_table",
  };

  if (supabaseConfigured()) {
    const supabase = createServerSupabaseClient(await cookies());
    jobDashboard = await loadProfileJobDashboard(supabase, sessionUser.id, {
      skills: profile.skills,
      headline: profile.headline,
      summary: profile.summary,
    });
  }

  const semanticJobMatches = await loadSemanticJobMatches(profile, 12);

  return {
    profile,
    recommendedJobs: jobDashboard.recommended,
    semanticJobMatches,
    jobPipeline: jobDashboard.pipeline,
    feedKind: jobDashboard.feedKind,
  };
}
