"use client";

import type { ResumeImprovement } from "@/lib/talent-intelligence/types";
import { Badge } from "@/components/ui/badge";
import ExpandableCard from "../shared/ExpandableCard";
import { FileEdit } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";

type Props = { items: ResumeImprovement[] };

export default function ResumeImprovementsSection({ items }: Props) {
  if (!items.length) return null;

  return (
    <ExpandableCard
      title="Resume Improvement Suggestions"
      description="Section-by-section guidance — never fabricated content."
      icon={<FileEdit className={iconClass("inline", "text-primary")} />}
      defaultOpen={false}
    >
      <ul className="flex flex-col gap-[var(--layout-stack-group)]">
        {items.map((item, i) => (
          <li key={i} className="rounded-lg border p-[var(--space-4)]">
            <Badge variant="outline" className="capitalize">
              {item.section}
            </Badge>
            <p className="mt-[var(--space-2)] text-role-body">
              <span className="font-medium">Current: </span>
              {item.currentObservation}
            </p>
            <p className="mt-[var(--space-1)] text-role-body text-muted-foreground">
              <span className="font-medium">Why it matters: </span>
              {item.whyItMatters}
            </p>
            <p className="mt-[var(--space-2)] text-role-body">
              <span className="font-medium">Recommendation: </span>
              {item.recommendation}
            </p>
            <p className="mt-[var(--space-2)] rounded-md bg-muted/50 p-[var(--space-2)] text-role-caption italic text-muted-foreground">
              {item.exampleGuidance}
            </p>
          </li>
        ))}
      </ul>
    </ExpandableCard>
  );
}
