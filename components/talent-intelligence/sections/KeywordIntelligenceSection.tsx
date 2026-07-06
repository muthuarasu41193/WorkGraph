"use client";

import type { KeywordIntelligence } from "@/lib/talent-intelligence/types";
import { Badge } from "@/components/ui/badge";
import ExpandableCard from "../shared/ExpandableCard";
import { Tags } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { data: KeywordIntelligence };

const STATUS_LABELS = {
  present: { label: "Present", className: "bg-success-subtle text-success-foreground dark:bg-success-subtle" },
  missing: { label: "Missing", className: "bg-rose-100 text-rose-800 dark:bg-rose-950" },
  weak: { label: "Weak", className: "bg-warning-subtle text-warning-foreground dark:bg-warning-subtle" },
  overused: { label: "Overused", className: "bg-violet-100 text-violet-800 dark:bg-violet-950" },
};

export default function KeywordIntelligenceSection({ data }: Props) {
  return (
    <ExpandableCard
      title="Keyword Intelligence"
      description="Important terms from the job description compared to your resume."
      icon={<Tags className="h-5 w-5 text-primary" />}
      defaultOpen={false}
    >
      <p className="mb-4 text-sm text-muted-foreground">{data.summary}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {data.extractedFromJd.slice(0, 15).map((kw) => (
          <Badge key={kw} variant="outline" className="text-xs">
            {kw}
          </Badge>
        ))}
      </div>
      <ul className="space-y-2 max-h-96 overflow-y-auto">
        {data.comparison.map((item, i) => {
          const style = STATUS_LABELS[item.status];
          return (
            <li key={i} className="rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{item.keyword}</span>
                <Badge className={cn("text-xs", style.className)}>{style.label}</Badge>
              </div>
              <p className="mt-1 text-muted-foreground">{item.explanation}</p>
              {item.resumeEvidence ? (
                <p className="mt-1 text-xs italic">Evidence: {item.resumeEvidence}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </ExpandableCard>
  );
}
