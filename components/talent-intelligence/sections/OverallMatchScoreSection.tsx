"use client";

import type { OverallMatchScore } from "@/lib/talent-intelligence/types";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import ExpandableCard from "../shared/ExpandableCard";
import ScoreRing from "../shared/ScoreRing";
import { Target } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";

type Props = { data: OverallMatchScore };

export default function OverallMatchScoreSection({ data }: Props) {
  return (
    <ExpandableCard
      title="Overall Match Score"
      description="Weighted analysis across 11 dimensions — not simple keyword matching."
      icon={<Target className={iconClass("inline", "text-primary")} />}
    >
      <div className="flex flex-col gap-[var(--space-6)] lg:flex-row lg:items-start">
        <div className="relative flex shrink-0 justify-center lg:w-40">
          <ScoreRing score={data.score} size="lg" />
          <Badge className="absolute -bottom-1" variant="secondary">
            Grade {data.grade}
          </Badge>
        </div>
        <div className="min-w-0 flex-1 wg-stack-group">
          <p className="text-role-body leading-relaxed text-muted-foreground">{data.summary}</p>
          <p className="text-role-caption text-muted-foreground italic">{data.methodology}</p>
          <div className="grid gap-[var(--space-3)] sm:grid-cols-2">
            {data.dimensions.map((dim) => (
              <div
                key={dim.dimension}
                className="flex flex-col gap-[var(--space-1)] rounded-lg border bg-muted/30 p-[var(--space-3)]"
              >
                <div className="flex items-center justify-between gap-[var(--space-2)] text-role-body">
                  <span className="font-medium">{dim.label}</span>
                  <span className="tabular-nums text-muted-foreground">{dim.score}%</span>
                </div>
                <Progress value={dim.score} className="h-2" />
                <p className="text-role-caption text-muted-foreground">{dim.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ExpandableCard>
  );
}
