"use client";

import { Target } from "lucide-react";
import { buildCompletenessSuggestions } from "../../../lib/profile-mock-data";
import type { ATSFeedback, Profile } from "../../../lib/types";
import CircularProgress from "../primitives/CircularProgress";
import ProfileCard from "../primitives/ProfileCard";
import ProfileBadge from "../primitives/ProfileBadge";
import SectionHeader from "../primitives/SectionHeader";
import { Progress } from "@/components/ui/progress";

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
        description="Signals that affect recruiter discovery and resume screening."
      />

      <div className="grid gap-8 md:grid-cols-[auto_1fr]">
        <div className="flex flex-wrap items-start justify-center gap-8 sm:justify-start md:flex-col md:gap-6">
          <CircularProgress value={completeness} label="Profile" />
          <CircularProgress
            value={resumeScore}
            label="ATS"
            sublabel={atsFeedback?.grade ? `Grade ${atsFeedback.grade}` : undefined}
          />
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <ProfileBadge tone="info">Strength {aiStrength}%</ProfileBadge>
            <ProfileBadge tone={resumeScore >= 70 ? "success" : "warning"}>
              Resume {resumeScore || "—"} / 100
            </ProfileBadge>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-caption">
              <span className="font-medium text-[var(--text-primary)]/85">Overall completeness</span>
              <span className="tabular-nums font-semibold text-[var(--text-primary)]">{completeness}%</span>
            </div>
            <Progress value={completeness} className="h-1.5" />
          </div>

          <div>
            <p className="mb-2 text-caption font-semibold text-[var(--text-primary)]">Suggested improvements</p>
            <ul className="space-y-2">
              {suggestions.map((tip) => (
                <li key={tip} className="flex gap-2.5 text-body text-[var(--text-primary)]/85">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </ProfileCard>
  );
}
