"use client";

import { motion } from "framer-motion";
import type { RecommendedJobCard } from "../../../lib/job-dashboard";
import type { Profile } from "../../../lib/types";
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
import { jobCardsToMatches } from "./job-match-utils";

export type ProfileShellProps = {
  profile: Profile;
  userId: string;
  recommendedJobs?: RecommendedJobCard[];
};

export default function ProfileShell({ profile, userId, recommendedJobs }: ProfileShellProps) {
  const jobMatches = jobCardsToMatches(recommendedJobs);

  return (
    <ProfileThemeProvider>
      <div className="min-h-[100dvh] bg-[var(--wg-color-surface-variant)]">
        <ProfileTopBar />

        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8"
        >
          <motion.div
            className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-8"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.4 }}
          >
            <div className="min-w-0 space-y-6">
              <ProfileHero profile={profile} userId={userId} />
              <ProfileCompleteness
                profile={profile}
                atsScore={profile.ats_score}
                atsFeedback={profile.ats_feedback}
              />
              <ProfileJobMatches jobs={jobMatches} />
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
          </motion.div>
        </motion.main>

        <ProfileSaveStatus />
      </div>
    </ProfileThemeProvider>
  );
}
