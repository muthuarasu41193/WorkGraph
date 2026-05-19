"use client";

import type { ComponentType } from "react";
import { motion } from "framer-motion";
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

const ICONS: Record<ProfileActivity["type"], ComponentType<{ className?: string }>> = {
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

      <ul className="space-y-1">
        {activities.map((item, i) => {
          const Icon = ICONS[item.type];
          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ backgroundColor: "var(--wg-color-surface-variant)" }}
              className="flex gap-3 rounded-xl px-3 py-3 transition"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--wg-color-surface-variant)] text-[var(--wg-color-primary)]">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--wg-color-text-primary)]">{item.title}</p>
                <p className="text-xs text-[var(--wg-color-text-secondary)]">{item.subtitle}</p>
              </div>
              <span className="shrink-0 text-xs tabular-nums text-[var(--wg-color-text-tertiary)]">{item.timeAgo}</span>
            </motion.li>
          );
        })}
      </ul>
    </ProfileCard>
  );
}
