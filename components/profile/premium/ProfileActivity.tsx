"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bookmark,
  Briefcase,
  MessageCircle,
  Newspaper,
  UserCheck,
} from "lucide-react";
import { MOCK_ACTIVITIES, type ProfileActivity } from "../../../lib/profile-mock-data";
import ProfileCard from "../primitives/ProfileCard";
import SectionHeader from "../primitives/SectionHeader";

const ICONS: Record<ProfileActivity["type"], LucideIcon> = {
  applied: Briefcase,
  saved: Bookmark,
  recruiter: UserCheck,
  post: Newspaper,
  engagement: MessageCircle,
};

type Props = {
  activities?: ProfileActivity[];
};

export default function ProfileActivity({ activities = MOCK_ACTIVITIES }: Props) {
  return (
    <ProfileCard id="activity">
      <SectionHeader
        icon={Activity}
        eyebrow="Timeline"
        title="Recent activity"
        description="Applications, saves, recruiter touchpoints, and posts."
      />

      <ul className="divide-y divide-[var(--wg-color-border)]">
        {activities.map((item) => {
          const Icon = ICONS[item.type];
          return (
            <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--wg-color-border)] bg-[var(--wg-color-surface-variant)] text-[var(--wg-color-text-secondary)]">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--wg-color-text-primary)]">{item.title}</p>
                <p className="text-xs text-[var(--wg-color-text-tertiary)]">{item.subtitle}</p>
              </div>
              <span className="shrink-0 text-xs tabular-nums text-[var(--wg-color-text-tertiary)]">{item.timeAgo}</span>
            </li>
          );
        })}
      </ul>
    </ProfileCard>
  );
}
