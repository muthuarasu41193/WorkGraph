"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { FeedDemoHint, JobPipelineCounts, RecommendedJobCard } from "../../../lib/job-dashboard";
import DashboardHydrator from "../../dashboard/DashboardHydrator";
import DashboardLayout from "../../dashboard/layout/DashboardLayout";
import DashboardSectionSkeleton from "../../dashboard/DashboardSectionSkeleton";
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
import HiddenDiscoveryPromoCard from "../../hidden-discovery/HiddenDiscoveryPromoCard";
import { resolveProfileJobMatches, type JobMatchPreviewExt } from "./job-match-utils";
import { workgraphApiEnabled } from "../../../lib/workgraph-api";
import type { Profile } from "../../../lib/types";

const ProfileJobsView = dynamic(() => import("../ProfileJobsView"), {
  loading: () => <DashboardSectionSkeleton />,
  ssr: false,
});

const HiddenJobsSection = dynamic(() => import("../../dashboard/sections/HiddenJobsSection"), {
  loading: () => <DashboardSectionSkeleton />,
  ssr: false,
});

const HiddenDiscoverySection = dynamic(() => import("../../hidden-discovery/HiddenDiscoverySection"), {
  loading: () => <DashboardSectionSkeleton />,
  ssr: false,
});

const InterviewVaultSection = dynamic(() => import("../../dashboard/sections/InterviewVaultSection"), {
  loading: () => <DashboardSectionSkeleton />,
  ssr: false,
});

const JobNewsSection = dynamic(() => import("../../dashboard/sections/JobNewsSection"), {
  loading: () => <DashboardSectionSkeleton />,
  ssr: false,
});

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
  const jobMatches = useMemo(
    () => resolveProfileJobMatches(semanticJobMatches, recommendedJobs, feedKind),
    [semanticJobMatches, recommendedJobs, feedKind],
  );
  const wgEnabled = workgraphApiEnabled();
  const atsJobs = useMemo(
    () => recommendedJobs.filter((j) => !j.isCommunity),
    [recommendedJobs],
  );

  const dashboardValue = useMemo(
    () => ({
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
    }),
    [
      profile,
      userId,
      recommendedJobs,
      communityPosts,
      semanticJobMatches,
      jobPipeline,
      liveListings,
      listingsBySource,
      feedKind,
      feedDemoHint,
    ],
  );

  const sections = useMemo(
    () => ({
      home: (
        <div className="space-y-5">
          <ProfileHero profile={profile} userId={userId} />
          <ProfileKpiStrip profile={profile} />
          <HiddenDiscoveryPromoCard />
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
        <ProfileJobsView
          jobs={atsJobs.length ? atsJobs : recommendedJobs}
          skillHints={profile.skills}
          profileHeadline={profile.headline}
          profileSummary={profile.summary}
          feedKind={feedKind}
          feedDemoHint={feedDemoHint}
          liveListings={liveListings}
          jobPipeline={jobPipeline ?? { applied: 0, interview: 0, offers: 0, saved: 0 }}
          profileCompleteness={profile.profile_completeness ?? 0}
        />
      ),
      "hidden-jobs": <HiddenJobsSection />,
      "job-discovery": <HiddenDiscoverySection />,
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
    }),
    [
      profile,
      userId,
      jobMatches,
      liveListings,
      feedKind,
      atsJobs,
      recommendedJobs,
      feedDemoHint,
      jobPipeline,
    ],
  );

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
