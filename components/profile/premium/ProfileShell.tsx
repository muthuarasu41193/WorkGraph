"use client";

import type { FeedDemoHint, JobPipelineCounts, RecommendedJobCard } from "../../../lib/job-dashboard";
import type { Profile } from "../../../lib/types";
import { workgraphApiEnabled } from "../../../lib/workgraph-api";
import DashboardHydrator from "../../dashboard/DashboardHydrator";
import DashboardTabs from "../../dashboard/DashboardTabs";
import ProfileThemeProvider from "../theme/ProfileThemeProvider";
import ProfileTopBar from "../ProfileTopBar";
import ProfileSaveStatus from "../ProfileSaveStatus";
import ProfileHero from "./ProfileHero";
import ProfileCompleteness from "./ProfileCompleteness";
import ProfileSkills from "./ProfileSkills";
import ProfileExperience from "./ProfileExperience";
import ProfileEducation from "./ProfileEducation";
import ProfileAiInsights from "./ProfileAiInsights";
import ProfileJobMatches from "./ProfileJobMatches";
import ProfileActivity from "./ProfileActivity";
import ProfileSidebar from "./ProfileSidebar";
import ProfileJobDashboard from "../ProfileJobDashboard";
import RecommendedJobsSection from "../RecommendedJobsSection";
import { resolveProfileJobMatches, type JobMatchPreviewExt } from "./job-match-utils";

export type ProfileShellProps = {
  profile: Profile;
  userId: string;
  recommendedJobs?: RecommendedJobCard[];
  semanticJobMatches?: JobMatchPreviewExt[] | null;
  jobPipeline?: JobPipelineCounts;
  liveListings?: number;
  listingsBySource?: Partial<Record<string, number>>;
  feedKind?: "live" | "demo";
  feedDemoHint?: FeedDemoHint | null;
};

function ProfileKpiStrip({ profile }: { profile: Profile }) {
  const completeness = Math.max(0, Math.min(100, profile.profile_completeness ?? 0));
  const ats = profile.ats_score ?? profile.ats_feedback?.score ?? 0;

  return (
    <dl className="wg-profile-kpi" aria-label="Profile metrics">
      <div>
        <dt>Profile complete</dt>
        <dd>{completeness}%</dd>
      </div>
      <div>
        <dt>ATS score</dt>
        <dd>{ats ? `${ats}` : "—"}</dd>
      </div>
      <div>
        <dt>Skills listed</dt>
        <dd>{profile.skills.length}</dd>
      </div>
      <div>
        <dt>Experience</dt>
        <dd>{profile.work_experience.length}</dd>
      </div>
    </dl>
  );
}

export default function ProfileShell({
  profile,
  userId,
  recommendedJobs,
  semanticJobMatches,
  jobPipeline,
  liveListings = 0,
  listingsBySource = {},
  feedKind = "demo",
  feedDemoHint,
}: ProfileShellProps) {
  const jobMatches = resolveProfileJobMatches(semanticJobMatches, recommendedJobs, feedKind);
  const wgEnabled = workgraphApiEnabled();
  const jobsFeed = recommendedJobs ?? [];

  const overview = (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
      <div className="min-w-0 space-y-5">
        <ProfileJobDashboard
          stats={jobPipeline ?? { applied: 0, interview: 0, offers: 0, saved: 0 }}
          profileCompleteness={profile.profile_completeness ?? 0}
          liveListings={liveListings}
          listingsBySource={listingsBySource}
        />
        <ProfileCompleteness
          profile={profile}
          atsScore={profile.ats_score}
          atsFeedback={profile.ats_feedback}
        />
        <ProfileJobMatches jobs={jobMatches} liveListings={liveListings} feedKind={feedKind} />
        <RecommendedJobsSection
          jobs={jobsFeed}
          skillHints={profile.skills}
          feedKind={feedKind}
          feedDemoHint={feedDemoHint}
        />
        <ProfileAiInsights />
        <ProfileSkills userId={userId} initialSkills={profile.skills} />
        <ProfileExperience userId={userId} experience={profile.work_experience} />
        <ProfileEducation
          userId={userId}
          education={profile.education}
          certifications={profile.certifications}
        />
        <ProfileActivity />
      </div>
      <ProfileSidebar />
    </div>
  );

  return (
    <ProfileThemeProvider>
      <div className="wg-profile-app">
        {wgEnabled ? <DashboardHydrator /> : null}
        <ProfileTopBar profileName={profile.full_name} />

        <main className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6 lg:py-8">
          <div className="space-y-5">
            <ProfileHero profile={profile} userId={userId} />
            <ProfileKpiStrip profile={profile} />
            <DashboardTabs overview={overview} workgraphEnabled={wgEnabled} />
          </div>
        </main>

        <ProfileSaveStatus />
      </div>
    </ProfileThemeProvider>
  );
}
