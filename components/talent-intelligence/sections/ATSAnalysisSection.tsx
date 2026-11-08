"use client";

import type { ATSAnalysis } from "@/lib/talent-intelligence/types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ExpandableCard from "../shared/ExpandableCard";
import { ScanSearch } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import { cn } from "@/lib/utils";

type Props = { data: ATSAnalysis };

const STATUS_STYLES = {
  good: "bg-positive-wash text-positive  ",
  warning: "bg-caution-wash text-caution  ",
  critical: "bg-danger-wash text-danger  ",
};

export default function ATSAnalysisSection({ data }: Props) {
  return (
    <ExpandableCard
      title="ATS Analysis"
      description="Formatting, readability, and parser compatibility."
      icon={<ScanSearch className={iconClass("inline", "text-primary")} />}
      defaultOpen={false}
    >
      <div className="wg-stack-group">
        <div className="flex items-center gap-[var(--space-4)]">
          <span className="text-role-body font-medium">ATS Score</span>
          <Progress value={data.overallScore} className="h-2 flex-1" />
          <span className="tabular-nums text-role-body font-semibold">{data.overallScore}%</span>
        </div>
        <div className="grid gap-[var(--space-2)] text-role-body text-muted-foreground sm:grid-cols-2">
          <p><span className="font-medium text-foreground">Section order: </span>{data.sectionOrder}</p>
          <p><span className="font-medium text-foreground">Length: </span>{data.lengthAssessment}</p>
          <p><span className="font-medium text-foreground">Formatting: </span>{data.formattingNotes}</p>
          <p><span className="font-medium text-foreground">Readability: </span>{data.readabilityNotes}</p>
        </div>
        <ul className="flex flex-col gap-[var(--layout-stack-tight)]">
          {data.indicators.map((ind, i) => (
            <li
              key={i}
              className="flex flex-col gap-[var(--space-1)] rounded-lg border p-[var(--space-3)] sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <span className="font-medium">{ind.category}</span>
                <p className="text-role-body text-muted-foreground">{ind.observation}</p>
                <p className="mt-[var(--space-1)] text-role-caption">{ind.recommendation}</p>
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
