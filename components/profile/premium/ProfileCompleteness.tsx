"use client";

import { motion } from "framer-motion";
import { Sparkles, Target } from "lucide-react";
import { buildCompletenessSuggestions } from "../../../lib/profile-mock-data";
import type { ATSFeedback, Profile } from "../../../lib/types";
import CircularProgress from "../primitives/CircularProgress";
import ProfileCard from "../primitives/ProfileCard";
import ProfileBadge from "../primitives/ProfileBadge";
import SectionHeader from "../primitives/SectionHeader";

type Props = {
  profile: Profile;
  atsScore: number | null;
  atsFeedback: ATSFeedback | null;
  aiStrength?: number;
};

export default function ProfileCompleteness({
  profile,
  atsScore,
  atsFeedback,
  aiStrength = 84,
}: Props) {
  const completeness = Math.max(0, Math.min(100, profile.profile_completeness ?? 0));
  const resumeScore = atsFeedback?.score ?? atsScore ?? 0;
  const suggestions = buildCompletenessSuggestions(profile);

  return (
    <ProfileCard>
      <SectionHeader
        icon={Target}
        eyebrow="Profile health"
        title="Completeness & ATS"
        description="AI-powered signals to strengthen recruiter discovery."
      />

      <motion.div
        className="grid gap-8 md:grid-cols-[auto_1fr]"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="flex flex-col items-center gap-6 sm:flex-row md:flex-col">
          <CircularProgress value={completeness} label="Profile" />
          <CircularProgress value={resumeScore} label="ATS" sublabel={atsFeedback?.grade ? `Grade ${atsFeedback.grade}` : undefined} />
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <ProfileBadge tone="info">
              <Sparkles className="mr-1 inline h-3 w-3" />
              AI strength {aiStrength}%
            </ProfileBadge>
            <ProfileBadge tone={resumeScore >= 70 ? "success" : "warning"}>
              Resume {resumeScore || "—"} / 100
            </ProfileBadge>
          </div>

          <motion.div
            className="h-2 overflow-hidden rounded-full bg-[var(--wg-color-border)]/40"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="h-full rounded-full bg-[var(--wg-color-primary)]"
              initial={{ width: 0 }}
              whileInView={{ width: `${completeness}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>

          <motion.div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--wg-color-text-tertiary)]">
              Suggested improvements
            </p>
            <ul className="space-y-2">
              {suggestions.map((tip, i) => (
                <motion.li
                  key={tip}
                  initial={{ opacity: 0, x: -6 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-2 text-sm text-[var(--wg-color-text-secondary)]"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--wg-color-primary)]" />
                  {tip}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </motion.div>
    </ProfileCard>
  );
}
