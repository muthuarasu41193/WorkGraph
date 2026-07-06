"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
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
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";

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
      <h3 className="mb-3 flex items-center gap-2 text-caption font-semibold text-[var(--text-primary)]">
        <Icon className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
        {title}
      </h3>
      {children}
    </ProfileCard>
  );
}

export default function ProfileSidebar() {
  const data = MOCK_SIDEBAR;

  const interviewColumns = useMemo<ColumnDef<(typeof data.interviews)[number]>[]>(
    () => [
      {
        accessorKey: "company",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />,
        cell: ({ row }) => (
          <span className="font-medium text-[var(--text-primary)]">{row.original.company}</span>
        ),
      },
      {
        accessorKey: "date",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        cell: ({ row }) => (
          <span className="tabular-nums text-[var(--text-tertiary)]">{row.original.date}</span>
        ),
      },
    ],
    [],
  );

  return (
    <aside className="wg-profile-aside space-y-4 lg:sticky lg:top-16 lg:max-h-[calc(100dvh-4.5rem)] lg:overflow-y-auto">
      <Widget title="Profile analytics" icon={BarChart3}>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-caption text-[var(--text-tertiary)]">Profile views</dt>
            <dd className="mt-1 text-heading-m tabular-nums text-[var(--text-primary)]">
              {data.analytics.profileViews}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-[var(--text-tertiary)]">Search appearances</dt>
            <dd className="mt-1 text-heading-m tabular-nums text-[var(--text-primary)]">
              {data.analytics.searchAppearances}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-caption font-medium text-success-foreground dark:text-success">{data.analytics.trend} vs last week</p>
      </Widget>

      <Widget title="Recruiter views" icon={Eye}>
        <p className="text-heading-l tabular-nums text-[var(--text-primary)]">{data.recruiterViews}</p>
        <p className="mt-1 text-caption text-[var(--text-tertiary)]">This week</p>
      </Widget>

      <Widget title="Interview tracker" icon={Calendar}>
        <DataTable
          columns={interviewColumns}
          data={data.interviews}
          getRowId={(row) => row.company}
          caption="Upcoming interviews"
          enableFiltering={false}
          enableColumnVisibility={false}
          enableColumnResizing={false}
          enablePagination={data.interviews.length > 5}
          pageSize={5}
          stickyHeader={false}
        />
      </Widget>

      <Widget title="Trending skills" icon={TrendingUp}>
        <div className="flex flex-wrap gap-2">
          {data.trendingSkills.map((s) => (
            <span
              key={s}
              className="rounded-md border border-[var(--border-default)] bg-[var(--surface-secondary)] px-2 py-1 text-caption font-medium text-[var(--text-primary)]/85"
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
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--surface-secondary)] text-caption font-bold text-[var(--accent)]">
                {c.name[0]}
              </span>
              <div className="min-w-0">
                <p className="truncate text-body font-medium text-[var(--text-primary)]">{c.name}</p>
                <p className="truncate text-caption text-[var(--text-tertiary)]">
                  {c.role} · {c.company}
                </p>
                <p className="text-caption text-[var(--text-tertiary)]">{c.mutual} mutual connections</p>
              </div>
            </li>
          ))}
        </ul>
      </Widget>

      <ProfileCard padding="sm">
        <h3 className="flex items-center gap-2 text-caption font-semibold text-[var(--text-primary)]">
          <Lightbulb className="h-3.5 w-3.5 text-[var(--accent)]" />
          Daily tip
        </h3>
        <p className="mt-2 text-body text-[var(--text-primary)]/85">{data.dailyTip}</p>
      </ProfileCard>
    </aside>
  );
}
