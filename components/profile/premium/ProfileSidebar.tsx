"use client";

import type { ComponentType, ReactNode } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Calendar,
  Eye,
  Lightbulb,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { MOCK_SIDEBAR } from "../../../lib/profile-mock-data";
import ProfileCard from "../primitives/ProfileCard";

function Widget({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <ProfileCard padding="sm" hover>
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--wg-color-text-tertiary)]">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </p>
      {children}
    </ProfileCard>
  );
}

export default function ProfileSidebar() {
  const data = MOCK_SIDEBAR;

  return (
    <aside className="space-y-4 xl:sticky xl:top-[4.5rem] xl:max-h-[calc(100dvh-5rem)] xl:overflow-y-auto xl:pr-1">
      <Widget title="Profile analytics" icon={BarChart3}>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[var(--wg-color-text-tertiary)]">Views</dt>
            <dd className="text-xl font-bold tabular-nums">{data.analytics.profileViews}</dd>
          </div>
          <div>
            <dt className="text-[var(--wg-color-text-tertiary)]">Search</dt>
            <dd className="text-xl font-bold tabular-nums">{data.analytics.searchAppearances}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-[var(--wg-color-success)]">{data.analytics.trend} vs last week</p>
      </Widget>

      <Widget title="Recruiter views" icon={Eye}>
        <p className="text-2xl font-bold tabular-nums">{data.recruiterViews}</p>
        <p className="text-xs text-[var(--wg-color-text-secondary)]">This week</p>
      </Widget>

      <Widget title="Interview tracker" icon={Calendar}>
        <ul className="space-y-2">
          {data.interviews.map((iv) => (
            <li
              key={iv.company}
              className="flex items-center justify-between rounded-lg bg-[var(--wg-color-surface-variant)] px-3 py-2 text-sm"
            >
              <span className="font-medium">{iv.company}</span>
              <span className="text-xs text-[var(--wg-color-text-tertiary)]">{iv.date}</span>
            </li>
          ))}
        </ul>
      </Widget>

      <Widget title="Trending skills" icon={TrendingUp}>
        <motion.div className="flex flex-wrap gap-1.5">
          {data.trendingSkills.map((s) => (
            <span
              key={s}
              className="rounded-lg bg-[var(--wg-color-surface-variant)] px-2 py-1 text-xs font-medium text-[var(--wg-color-text-secondary)]"
            >
              {s}
            </span>
          ))}
        </motion.div>
      </Widget>

      <Widget title="Suggested connections" icon={UserPlus}>
        <ul className="space-y-3">
          {data.connections.map((c) => (
            <li key={c.id} className="flex gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--wg-color-primary)]/15 text-xs font-bold text-[var(--wg-color-primary)]">
                {c.name[0]}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="truncate text-xs text-[var(--wg-color-text-tertiary)]">
                  {c.role} · {c.company}
                </p>
                <p className="text-[10px] text-[var(--wg-color-text-tertiary)]">{c.mutual} mutual</p>
              </div>
            </li>
          ))}
        </ul>
      </Widget>

      <ProfileCard padding="sm" className="border-[var(--wg-color-primary)]/25 bg-[var(--wg-color-primary)]/5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--wg-color-primary)]">
          <Lightbulb className="h-3.5 w-3.5" />
          Daily tip
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--wg-color-text-secondary)]">{data.dailyTip}</p>
      </ProfileCard>
    </aside>
  );
}
