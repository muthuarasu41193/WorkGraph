"use client";

import type { FeedDemoHint, JobPipelineCounts, RecommendedJobCard } from "../../../lib/job-dashboard";
import type { Profile } from "../../../lib/types";
import { workgraphApiEnabled } from "../../../lib/workgraph-api";
import DashboardHydrator from "../../dashboard/DashboardHydrator";
import DashboardLayout from "../../dashboard/layout/DashboardLayout";
import { DashboardProvider } from "../../dashboard/DashboardProvider";
import DashboardViewRouter from "../../dashboard/sections/DashboardViewRouter";
import ProfileThemeProvider, { useProfileTheme } from "../theme/ProfileThemeProvider";
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
import HiddenJobsSection from "../../dashboard/sections/HiddenJobsSection";
import InterviewVaultSection from "../../dashboard/sections/InterviewVaultSection";
import JobNewsSection from "../../dashboard/sections/JobNewsSection";
import { resolveProfileJobMatches, type JobMatchPreviewExt } from "./job-match-utils";

export type ProfileShellProps = {
  profile: Profile;
  userId: string;
  recommendedJobs?: RecommendedJobCard[];
  communityPosts?: RecommendedJobCard[];
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

function ProfileShellInner({
  profile,
  userId,
  recommendedJobs = [],
  communityPosts = [],
  semanticJobMatches,
  jobPipeline,
  liveListings = 0,
  listingsBySource = {},
  feedKind = "demo",
  feedDemoHint,
}: ProfileShellProps) {
  const { theme, toggle } = useProfileTheme();
  const jobMatches = resolveProfileJobMatches(semanticJobMatches, recommendedJobs, feedKind);
  const wgEnabled = workgraphApiEnabled();
  const atsJobs = recommendedJobs.filter((j) => !j.isCommunity);

  const dashboardValue = {
    profile,
    userId,
    recommendedJobs,
    communityPosts,
    semanticJobMatches: semanticJobMatches ?? null,
    jobPipeline: jobPipeline ?? { applied: 0, interview: 0, offers: 0, saved: 0 },
    liveListings,
    listingsBySource,
    feedKind,
    feedDemoHint,
  };

  const sections = {
    home: (
      <div className="space-y-5">
        <ProfileHero profile={profile} userId={userId} />
        <ProfileKpiStrip profile={profile} />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div className="min-w-0 space-y-5">
            <ProfileJobMatches jobs={jobMatches} liveListings={liveListings} feedKind={feedKind} />
            <ProfileCompleteness
              profile={profile}
              atsScore={profile.ats_score}
              atsFeedback={profile.ats_feedback}
            />
            <ProfileAiInsights />
            <ProfileActivity />
          </div>
          <ProfileSidebar />
        </div>
      </div>
    ),
    jobs: (
      <div className="space-y-5">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live listings ranked for your skills and experience.
          </p>
        </header>
        <ProfileJobDashboard
          stats={jobPipeline ?? { applied: 0, interview: 0, offers: 0, saved: 0 }}
          profileCompleteness={profile.profile_completeness ?? 0}
          liveListings={liveListings}
          listingsBySource={listingsBySource}
        />
        <RecommendedJobsSection
          jobs={atsJobs.length ? atsJobs : recommendedJobs}
          skillHints={profile.skills}
          feedKind={feedKind}
          feedDemoHint={feedDemoHint}
          liveListings={liveListings}
        />
      </div>
    ),
    "hidden-jobs": <HiddenJobsSection />,
    vault: <InterviewVaultSection />,
    profile: (
      <div className="space-y-5">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Keep your resume data accurate and ATS-ready.</p>
        </header>
        <ProfileHero profile={profile} userId={userId} />
        <ProfileSkills userId={userId} initialSkills={profile.skills} />
        <ProfileExperience userId={userId} experience={profile.work_experience} />
        <ProfileEducation
          userId={userId}
          education={profile.education}
          certifications={profile.certifications}
        />
      </div>
    ),
    "job-news": <JobNewsSection />,
  };

  return (
    <DashboardProvider value={dashboardValue}>
      {wgEnabled ? <DashboardHydrator /> : null}
      <DashboardLayout isDark={theme === "dark"} onToggleTheme={toggle}>
        <DashboardViewRouter sections={sections} />
      </DashboardLayout>
      <ProfileSaveStatus />
    </DashboardProvider>
  );
}

export default function ProfileShell(props: ProfileShellProps) {
  return (
    <ProfileThemeProvider>
      <div className="wg-profile-app">
        <ProfileShellInner {...props} />
      </div>
    </ProfileThemeProvider>
  );
}
