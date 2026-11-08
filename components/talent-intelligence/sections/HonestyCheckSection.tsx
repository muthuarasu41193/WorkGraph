"use client";

import type { HonestyCheck } from "@/lib/talent-intelligence/types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ExpandableCard from "../shared/ExpandableCard";
import { ShieldCheck } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import { cn } from "@/lib/utils";

type Props = { data: HonestyCheck };

const SEVERITY_STYLES = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-caution-wash text-caution ",
  high: "bg-danger-wash text-danger ",
};

export default function HonestyCheckSection({ data }: Props) {
  return (
    <ExpandableCard
      title="Honesty Check"
      description="Authenticity signals — buzzwords, generic language, and weak measurables."
      icon={<ShieldCheck className={iconClass("inline", "text-positive")} />}
      defaultOpen={false}
    >
      <div className="mb-[var(--space-4)] flex items-center gap-[var(--space-4)]">
        <span className="text-role-body font-medium">Authenticity</span>
        <Progress value={data.authenticityScore} className="h-2 flex-1" />
        <span className="tabular-nums text-role-body font-semibold">{data.authenticityScore}%</span>
      </div>
      <p className="mb-[var(--space-4)] text-role-body text-muted-foreground">{data.overallAssessment}</p>
      {data.issues.length > 0 ? (
        <ul className="flex flex-col gap-[var(--space-3)]">
          {data.issues.map((issue, i) => (
            <li key={i} className="rounded-lg border p-[var(--space-3)] text-role-body">
              <div className="flex flex-wrap items-center gap-[var(--space-2)]">
                <span className="font-medium">{issue.issue}</span>
                <Badge className={cn("text-role-caption capitalize", SEVERITY_STYLES[issue.severity])}>
                  {issue.severity}
                </Badge>
              </div>
              <p className="mt-[var(--space-1)] text-muted-foreground">Evidence: {issue.evidence}</p>
              <p className="mt-[var(--space-1)]">{issue.recommendation}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-role-body text-positive">
          No significant authenticity concerns detected.
        </p>
      )}
    </ExpandableCard>
  );
}
