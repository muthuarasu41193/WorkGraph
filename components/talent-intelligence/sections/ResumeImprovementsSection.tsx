"use client";

import type { ResumeImprovement } from "@/lib/talent-intelligence/types";
import { Badge } from "@/components/ui/badge";
import ExpandableCard from "../shared/ExpandableCard";
import { FileEdit } from "lucide-react";

type Props = { items: ResumeImprovement[] };

export default function ResumeImprovementsSection({ items }: Props) {
  if (!items.length) return null;

  return (
    <ExpandableCard
      title="Resume Improvement Suggestions"
      description="Section-by-section guidance — never fabricated content."
      icon={<FileEdit className="h-5 w-5 text-primary" />}
      defaultOpen={false}
    >
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li key={i} className="rounded-lg border p-4">
            <Badge variant="outline" className="capitalize">
              {item.section}
            </Badge>
            <p className="mt-2 text-body">
              <span className="font-medium">Current: </span>
              {item.currentObservation}
            </p>
            <p className="mt-1 text-body text-muted-foreground">
              <span className="font-medium">Why it matters: </span>
              {item.whyItMatters}
            </p>
            <p className="mt-2 text-body">
              <span className="font-medium">Recommendation: </span>
              {item.recommendation}
            </p>
            <p className="mt-2 rounded-md bg-muted/50 p-2 text-caption italic text-muted-foreground">
              {item.exampleGuidance}
            </p>
          </li>
        ))}
      </ul>
    </ExpandableCard>
  );
}
