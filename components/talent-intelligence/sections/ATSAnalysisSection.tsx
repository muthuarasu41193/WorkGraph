"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { ATSAnalysis } from "@/lib/talent-intelligence/types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import ExpandableCard from "../shared/ExpandableCard";
import { ScanSearch } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { data: ATSAnalysis };

type IndicatorRow = ATSAnalysis["indicators"][number];

const STATUS_STYLES = {
  good: "bg-success-subtle text-success-foreground dark:bg-success-subtle dark:text-success",
  warning: "bg-warning-subtle text-warning-foreground dark:bg-warning-subtle dark:text-warning",
  critical: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

export default function ATSAnalysisSection({ data }: Props) {
  const columns = useMemo<ColumnDef<IndicatorRow>[]>(
    () => [
      {
        accessorKey: "category",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
        cell: ({ row }) => <span className="font-medium">{row.original.category}</span>,
      },
      {
        accessorKey: "observation",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Observation" />,
        cell: ({ row }) => (
          <span className="text-[var(--text-secondary)]">{row.original.observation}</span>
        ),
      },
      {
        accessorKey: "recommendation",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Recommendation" />,
        cell: ({ row }) => <span className="text-caption">{row.original.recommendation}</span>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => (
          <Badge className={cn("capitalize", STATUS_STYLES[row.original.status])}>
            {row.original.status}
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <ExpandableCard
      title="ATS Analysis"
      description="Formatting, readability, and parser compatibility."
      icon={<ScanSearch className="h-5 w-5 text-primary" />}
      defaultOpen={false}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-body font-medium">ATS Score</span>
          <Progress value={data.overallScore} className="h-2 flex-1" />
          <span className="tabular-nums text-body font-semibold">{data.overallScore}%</span>
        </div>
        <div className="grid gap-2 text-body text-muted-foreground sm:grid-cols-2">
          <p><span className="font-medium text-foreground">Section order: </span>{data.sectionOrder}</p>
          <p><span className="font-medium text-foreground">Length: </span>{data.lengthAssessment}</p>
          <p><span className="font-medium text-foreground">Formatting: </span>{data.formattingNotes}</p>
          <p><span className="font-medium text-foreground">Readability: </span>{data.readabilityNotes}</p>
        </div>
        <DataTable
          columns={columns}
          data={data.indicators}
          getRowId={(row) => `${row.category}-${row.observation}`}
          caption="ATS analysis indicators"
          filterPlaceholder="Filter indicators…"
          enablePagination={data.indicators.length > 5}
          pageSize={5}
        />
      </div>
    </ExpandableCard>
  );
}
