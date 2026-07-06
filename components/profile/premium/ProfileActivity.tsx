"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
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
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";

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
  const columns = useMemo<ColumnDef<ProfileActivity>[]>(
    () => [
      {
        id: "type",
        header: "",
        cell: ({ row }) => {
          const Icon = ICONS[row.original.type];
          return (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] text-[var(--text-secondary)]">
              <Icon className="h-3.5 w-3.5" />
            </span>
          );
        },
        enableSorting: false,
        enableHiding: false,
        size: 48,
      },
      {
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Activity" />,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-[var(--text-primary)]">{row.original.title}</p>
            <p className="text-caption text-[var(--text-tertiary)]">{row.original.subtitle}</p>
          </div>
        ),
      },
      {
        accessorKey: "timeAgo",
        header: ({ column }) => <DataTableColumnHeader column={column} title="When" />,
        cell: ({ row }) => (
          <span className="tabular-nums text-[var(--text-tertiary)]">{row.original.timeAgo}</span>
        ),
      },
    ],
    [],
  );

  return (
    <ProfileCard id="activity">
      <SectionHeader
        icon={Activity}
        eyebrow="Timeline"
        title="Recent activity"
        description="Applications, saves, recruiter touchpoints, and posts."
      />

      <DataTable
        columns={columns}
        data={activities}
        getRowId={(row) => row.id}
        caption="Recent profile activity"
        filterPlaceholder="Search activity…"
        enableColumnVisibility={false}
        enablePagination={activities.length > 8}
        pageSize={8}
        stickyHeader={false}
      />
    </ProfileCard>
  );
}
