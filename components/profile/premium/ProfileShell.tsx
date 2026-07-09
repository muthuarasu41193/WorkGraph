"use client";

import dynamic from "next/dynamic";
import { useMemo, type ReactNode } from "react";
import type { FeedDemoHint, JobPipelineCounts, RecommendedJobCard } from "../../../lib/job-dashboard";
import DashboardHydrator from "../../dashboard/DashboardHydrator";
import DashboardLayout from "../../dashboard/layout/DashboardLayout";
import DashboardSectionSkeleton from "../../dashboard/DashboardSectionSkeleton";
import { DashboardProvider } from "../../dashboard/DashboardProvider";
import DashboardViewRouter from "../../dashboard/sections/DashboardViewRouter";
import ProfileThemeProvider from "../theme/ProfileThemeProvider";
import ProfileSaveStatus from "../ProfileSaveStatus";
import PageHero from "@/components/design-system/PageHero";
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

const WorkgraphDirectSection = dynamic(
  () => import("../../employer/seeker/WorkgraphDirectSection"),
  {
    loading: () => <DashboardSectionSkeleton />,
    ssr: false,
  },
);

const ResumeIntelligenceSection = dynamic(
  () => import("../../talent-intelligence/ResumeIntelligenceSection"),
  {
    loading: () => <DashboardSectionSkeleton />,
    ssr: false,
  },
);

const SettingsSection = dynamic(() => import("../../settings/SettingsSection"), {
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
      applications: (
        <div className="space-y-6">
          <PageHero
            title="Application Intelligence"
            subtitle="Track every opportunity and maximize your response rate."
          />
          <ApplicationsTracker userId={userId} />
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
          hasResume={Boolean(profile.resume_raw_text && profile.resume_raw_text.length >= 120)}
        />
      ),
      "hidden-jobs": <HiddenJobsSection />,
      "job-discovery": <HiddenDiscoverySection />,
      vault: <InterviewVaultSection />,
      profile: (
        <div className="space-y-6">
          <PageHero
            title="Your Profile"
            subtitle="Keep your skills, experience, and resume data accurate for better AI matching."
          />
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
      "workgraph-direct": (
        <WorkgraphDirectSection
          skills={profile.skills}
          headline={profile.headline}
          summary={profile.summary}
          profileCompleteness={profile.profile_completeness ?? 0}
          resumeUrl={profile.resume_url}
          linkedinUrl={profile.linkedin_url}
          githubUrl={profile.github_url}
          websiteUrl={profile.website_url}
          stackoverflowUrl={profile.stackoverflow_url}
        />
      ),
      "resume-intelligence": (
        <div className="space-y-6">
          <PageHero
            title="Your Resume Intelligence"
            subtitle="Improve your interview chances by fixing the highest-impact resume issues."
          />
          <ResumeIntelligenceSection
            hasResume={Boolean(profile.resume_raw_text && profile.resume_raw_text.length >= 120)}
          />
        </div>
      ),
      settings: <SettingsSection />,
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
      <DashboardLayout>
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
