"use client";

import type { ATSAnalysis } from "@/lib/talent-intelligence/types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ExpandableCard from "../shared/ExpandableCard";
import { ScanSearch } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { data: ATSAnalysis };

const STATUS_STYLES = {
  good: "bg-success-subtle text-success-foreground dark:bg-success-subtle dark:text-success",
  warning: "bg-warning-subtle text-warning-foreground dark:bg-warning-subtle dark:text-warning",
  critical: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

export default function ATSAnalysisSection({ data }: Props) {
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
        <ul className="space-y-2">
          {data.indicators.map((ind, i) => (
            <li key={i} className="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="font-medium">{ind.category}</span>
                <p className="text-body text-muted-foreground">{ind.observation}</p>
                <p className="mt-1 text-caption">{ind.recommendation}</p>
              </div>
              <Badge className={cn("shrink-0 capitalize", STATUS_STYLES[ind.status])}>
                {ind.status}
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    </ExpandableCard>
  );
}
