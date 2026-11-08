"use client";

import type { KeywordIntelligence } from "@/lib/talent-intelligence/types";
import { Badge } from "@/components/ui/badge";
import ExpandableCard from "../shared/ExpandableCard";
import { Tags } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import { cn } from "@/lib/utils";

type Props = { data: KeywordIntelligence };

const STATUS_LABELS = {
  present: { label: "Present", className: "bg-positive-wash text-positive " },
  missing: { label: "Missing", className: "bg-danger-wash text-danger " },
  weak: { label: "Weak", className: "bg-caution-wash text-caution " },
  overused: { label: "Overused", className: "bg-accent-wash text-accent " },
};

export default function KeywordIntelligenceSection({ data }: Props) {
  return (
    <ExpandableCard
      title="Keyword Intelligence"
      description="Important terms from the job description compared to your resume."
      icon={<Tags className={iconClass("inline", "text-primary")} />}
      defaultOpen={false}
    >
      <p className="mb-[var(--space-4)] text-role-body text-muted-foreground">{data.summary}</p>
      <div className="mb-[var(--space-4)] flex flex-wrap gap-[var(--space-1)]">
        {data.extractedFromJd.slice(0, 15).map((kw) => (
          <Badge key={kw} variant="outline" className="text-role-caption">
            {kw}
          </Badge>
        ))}
      </div>
      <ul className="max-h-96 flex flex-col gap-[var(--layout-stack-tight)] overflow-y-auto">
        {data.comparison.map((item, i) => {
          const style = STATUS_LABELS[item.status];
          return (
            <li key={i} className="rounded-lg border p-[var(--space-3)] text-role-body">
              <div className="flex flex-wrap items-center gap-[var(--space-2)]">
                <span className="font-medium">{item.keyword}</span>
                <Badge className={cn("text-role-caption", style.className)}>{style.label}</Badge>
              </div>
              <p className="mt-[var(--space-1)] text-muted-foreground">{item.explanation}</p>
              {item.resumeEvidence ? (
                <p className="mt-[var(--space-1)] text-role-caption italic">
                  Evidence: {item.resumeEvidence}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </ExpandableCard>
  );
}
