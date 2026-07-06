"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import type { JobMarketPulse } from "@/lib/home-dashboard";

type TrendingRole = JobMarketPulse["trendingRoles"][number];

export default function HomeJobMarketPulse({ pulse }: { pulse: JobMarketPulse }) {
  const columns = useMemo<ColumnDef<TrendingRole>[]>(
    () => [
      {
        id: "rank",
        header: "#",
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">{row.index + 1}</span>
        ),
        enableSorting: false,
        size: 48,
      },
      {
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
        cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
      },
      {
        accessorKey: "growth",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Growth" />,
        cell: ({ row }) => (
          <span className="text-caption font-semibold text-success-foreground dark:text-success">
            {row.original.growth}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <section className="space-y-3" aria-labelledby="home-pulse-heading">
      <h2 id="home-pulse-heading" className="text-heading-s">
        Job Market Pulse
      </h2>
      <p className="text-body text-muted-foreground">Trending roles and skills from your feed and market signals.</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="wg-dash-section-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-body-lg">
              <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
              Trending roles
            </CardTitle>
            <CardDescription>Highest momentum titles in your matched catalog.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={pulse.trendingRoles}
              getRowId={(row) => row.title}
              caption="Trending job roles"
              enableFiltering={false}
              enableColumnVisibility={false}
              enableColumnResizing={false}
              enablePagination={pulse.trendingRoles.length > 8}
              pageSize={8}
              stickyHeader={false}
            />
          </CardContent>
        </Card>

        <Card className="wg-dash-section-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-body-lg">Trending skills</CardTitle>
            <CardDescription>In-demand skills aligned to your profile and listings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pulse.trendingSkills.map((skill) => (
                <Badge key={skill} variant="outline" className="text-caption font-medium">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
