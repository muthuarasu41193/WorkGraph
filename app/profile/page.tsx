import { redirect } from "next/navigation";
import ProfileShell from "../../components/profile/premium/ProfileShell";
import { getSessionUser } from "../../lib/auth/session-server";
import { loadUserProfile } from "../../lib/load-profile";
import { loadProfileJobDashboard } from "../../lib/job-dashboard";
import { loadSemanticJobMatches } from "../../lib/workgraph-dashboard";
import { supabaseConfigured } from "../../lib/supabase-enabled";
import { createServerSupabaseClient } from "../../lib/supabase";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login?next=/profile");

  const profile = await loadUserProfile(sessionUser.id);
  if (!profile) redirect("/create-profile");

  let jobDashboard = {
    recommended: [] as Awaited<ReturnType<typeof loadProfileJobDashboard>>["recommended"],
    communityPosts: [] as Awaited<ReturnType<typeof loadProfileJobDashboard>>["communityPosts"],
    liveListings: 0,
    listingsBySource: {} as Record<string, number>,
  };

  if (supabaseConfigured()) {
    const supabase = createServerSupabaseClient(await cookies());
    jobDashboard = await loadProfileJobDashboard(supabase, sessionUser.id, {
      skills: profile.skills,
      headline: profile.headline,
    });
  }

  const semanticJobMatches = await loadSemanticJobMatches(profile, 12);

  return (
    <ProfileShell
      profile={profile}
      userId={sessionUser.id}
      recommendedJobs={jobDashboard.recommended}
      semanticJobMatches={semanticJobMatches}
    />
  );
}
