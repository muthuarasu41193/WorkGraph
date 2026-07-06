"use client";

import type { HonestyCheck } from "@/lib/talent-intelligence/types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ExpandableCard from "../shared/ExpandableCard";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { data: HonestyCheck };

const SEVERITY_STYLES = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning-subtle text-warning-foreground dark:bg-warning-subtle",
  high: "bg-rose-100 text-rose-800 dark:bg-rose-950",
};

export default function HonestyCheckSection({ data }: Props) {
  return (
    <ExpandableCard
      title="Honesty Check"
      description="Authenticity signals — buzzwords, generic language, and weak measurables."
      icon={<ShieldCheck className="h-5 w-5 text-success" />}
      defaultOpen={false}
    >
      <div className="mb-4 flex items-center gap-4">
        <span className="text-body font-medium">Authenticity</span>
        <Progress value={data.authenticityScore} className="h-2 flex-1" />
        <span className="tabular-nums text-body font-semibold">{data.authenticityScore}%</span>
      </div>
      <p className="mb-4 text-body text-muted-foreground">{data.overallAssessment}</p>
      {data.issues.length > 0 ? (
        <ul className="space-y-3">
          {data.issues.map((issue, i) => (
            <li key={i} className="rounded-lg border p-3 text-body">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{issue.issue}</span>
                <Badge className={cn("text-caption capitalize", SEVERITY_STYLES[issue.severity])}>
                  {issue.severity}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground">Evidence: {issue.evidence}</p>
              <p className="mt-1">{issue.recommendation}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body text-success-foreground dark:text-success">
          No significant authenticity concerns detected.
        </p>
      )}
    </ExpandableCard>
  );
}
