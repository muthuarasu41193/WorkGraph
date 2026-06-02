"use client";

import dynamic from "next/dynamic";
import { useMemo, type ReactNode } from "react";
import type { FeedDemoHint, JobPipelineCounts, RecommendedJobCard } from "../../../lib/job-dashboard";
import DashboardHydrator from "../../dashboard/DashboardHydrator";
import DashboardLayout from "../../dashboard/layout/DashboardLayout";
import DashboardSectionSkeleton from "../../dashboard/DashboardSectionSkeleton";
import { DashboardProvider } from "../../dashboard/DashboardProvider";
import DashboardViewRouter from "../../dashboard/sections/DashboardViewRouter";
import ProfileThemeProvider, { useProfileTheme } from "../theme/ProfileThemeProvider";
import ProfileSaveStatus from "../ProfileSaveStatus";
import ProfileHero from "./ProfileHero";
import ProfileSkills from "./ProfileSkills";
import ProfileExperience from "./ProfileExperience";
import ProfileEducation from "./ProfileEducation";
import ResumeAnalyzer from "@/app/(dashboard)/profile/components/ResumeAnalyzer";
import type { JobMatchPreviewExt } from "./job-match-utils";
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

const ApplicationsTracker = dynamic(() => import("../../applications/ApplicationsTracker"), {
  loading: () => <DashboardSectionSkeleton />,
  ssr: false,
});

export type ProfileShellProps = {
  profile: Profile;
  userId: string;
  homeDashboard: ReactNode;
  recommendedJobs?: RecommendedJobCard[];
  communityPosts?: RecommendedJobCard[];
  semanticJobMatches?: JobMatchPreviewExt[] | null;
  jobPipeline?: JobPipelineCounts;
  liveListings?: number;
  listingsBySource?: Partial<Record<string, number>>;
  feedKind?: "live" | "demo";
  feedDemoHint?: FeedDemoHint | null;
};

function ProfileShellInner({
  profile,
  userId,
  homeDashboard,
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
      home: homeDashboard,
      applications: <ApplicationsTracker userId={userId} />,
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
          <ResumeAnalyzer />
        </div>
      ),
      "job-news": <JobNewsSection />,
    }),
    [
      homeDashboard,
      profile,
      userId,
      atsJobs,
      recommendedJobs,
      feedDemoHint,
      jobPipeline,
      feedKind,
      liveListings,
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
