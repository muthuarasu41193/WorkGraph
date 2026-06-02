import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import HomeDashboard from "@/components/dashboard/home/HomeDashboard";
import ProfileShell from "../../components/profile/premium/ProfileShell";
import WorkGraphProviders from "../../components/providers/WorkGraphProviders";
import { getSessionUser } from "../../lib/auth/session-server";
import { loadProfileJobDashboard } from "../../lib/job-dashboard";
import { loadUserProfile } from "../../lib/load-profile";
import { supabaseConfigured } from "../../lib/supabase-enabled";
import { createServerSupabaseClient } from "../../lib/supabase";
import { loadSemanticJobMatches } from "../../lib/workgraph-dashboard";
import "../../components/profile/profile-theme.css";

export const dynamic = "force-dynamic";

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login?next=/profile");

  const profile = await loadUserProfile(sessionUser.id);
  if (!profile) redirect("/create-profile");

  let jobDashboard: Awaited<ReturnType<typeof loadProfileJobDashboard>> = {
    pipeline: { applied: 0, interview: 0, offers: 0, saved: 0 },
    recommended: [],
    communityPosts: [],
    liveListings: 0,
    listingsBySource: {},
    feedKind: "demo",
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

  const homeDashboard = (
    <HomeDashboard
      profile={profile}
      recommendedJobs={jobDashboard.recommended}
      semanticJobMatches={semanticJobMatches}
      jobPipeline={jobDashboard.pipeline}
      feedKind={jobDashboard.feedKind}
    />
  );

  return (
    <WorkGraphProviders>
      <div className="wg-profile-root">
        <ProfileShell
          profile={profile}
          userId={sessionUser.id}
          recommendedJobs={jobDashboard.recommended}
          semanticJobMatches={semanticJobMatches}
          jobPipeline={jobDashboard.pipeline}
          liveListings={jobDashboard.liveListings}
          listingsBySource={jobDashboard.listingsBySource}
          feedKind={jobDashboard.feedKind}
          feedDemoHint={jobDashboard.feedDemoHint}
          communityPosts={jobDashboard.communityPosts}
          homeDashboard={homeDashboard}
        />
        {children}
      </div>
    </WorkGraphProviders>
  );
}
