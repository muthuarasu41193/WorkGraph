"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
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
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <ProfileCard padding="sm" neutral>
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-[var(--wg-color-text-primary)]">
        <Icon className="h-3.5 w-3.5 text-[var(--wg-color-text-tertiary)]" />
        {title}
      </h3>
      {children}
    </ProfileCard>
  );
}

export default function ProfileSidebar() {
  const data = MOCK_SIDEBAR;

  return (
    <aside className="wg-profile-aside space-y-4 lg:sticky lg:top-[3.75rem] lg:max-h-[calc(100dvh-4.5rem)] lg:overflow-y-auto">
      <Widget title="Profile analytics" icon={BarChart3}>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-[var(--wg-color-text-tertiary)]">Profile views</dt>
            <dd className="mt-0.5 text-xl font-bold tabular-nums text-[var(--wg-color-text-primary)]">
              {data.analytics.profileViews}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--wg-color-text-tertiary)]">Search appearances</dt>
            <dd className="mt-0.5 text-xl font-bold tabular-nums text-[var(--wg-color-text-primary)]">
              {data.analytics.searchAppearances}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">{data.analytics.trend} vs last week</p>
      </Widget>

      <Widget title="Recruiter views" icon={Eye}>
        <p className="text-2xl font-bold tabular-nums text-[var(--wg-color-text-primary)]">{data.recruiterViews}</p>
        <p className="mt-0.5 text-xs text-[var(--wg-color-text-tertiary)]">This week</p>
      </Widget>

      <Widget title="Interview tracker" icon={Calendar}>
        <ul className="divide-y divide-[var(--wg-color-border)]">
          {data.interviews.map((iv) => (
            <li key={iv.company} className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0">
              <span className="font-medium text-[var(--wg-color-text-primary)]">{iv.company}</span>
              <span className="text-xs tabular-nums text-[var(--wg-color-text-tertiary)]">{iv.date}</span>
            </li>
          ))}
        </ul>
      </Widget>

      <Widget title="Trending skills" icon={TrendingUp}>
        <div className="flex flex-wrap gap-1.5">
          {data.trendingSkills.map((s) => (
            <span
              key={s}
              className="rounded-md border border-[var(--wg-color-border)] bg-[var(--wg-color-surface-variant)] px-2 py-1 text-xs font-medium text-[var(--wg-color-text-primary)]/85"
            >
              {s}
            </span>
          ))}
        </div>
      </Widget>

      <Widget title="Suggested connections" icon={UserPlus}>
        <ul className="space-y-3">
          {data.connections.map((c) => (
            <li key={c.id} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--wg-color-border)] bg-[var(--wg-color-surface-variant)] text-xs font-bold text-[var(--wg-color-primary)]">
                {c.name[0]}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--wg-color-text-primary)]">{c.name}</p>
                <p className="truncate text-xs text-[var(--wg-color-text-tertiary)]">
                  {c.role} · {c.company}
                </p>
                <p className="text-[11px] text-[var(--wg-color-text-tertiary)]">{c.mutual} mutual connections</p>
              </div>
            </li>
          ))}
        </ul>
      </Widget>

      <ProfileCard padding="sm">
        <h3 className="flex items-center gap-2 text-xs font-semibold text-[var(--wg-color-text-primary)]">
          <Lightbulb className="h-3.5 w-3.5 text-[var(--wg-color-primary)]" />
          Daily tip
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--wg-color-text-primary)]/85">{data.dailyTip}</p>
      </ProfileCard>
    </aside>
  );
}
