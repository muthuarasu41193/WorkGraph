"use client";

import type { StrengthItem } from "@/lib/talent-intelligence/types";
import { Badge } from "@/components/ui/badge";
import ExpandableCard from "../shared/ExpandableCard";
import { ThumbsUp } from "lucide-react";

type Props = { items: StrengthItem[] };

export default function StrengthsSection({ items }: Props) {
  if (!items.length) return null;

  return (
    <ExpandableCard
      title="Strengths"
      description="What aligns well with this role and why it matters."
      icon={<ThumbsUp className="h-5 w-5 text-success" />}
    >
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li key={i} className="rounded-lg border border-success/20/60 bg-success-subtle/50 p-4 dark:border-success/20/40 dark:bg-success-subtle/20">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold">{item.title}</h4>
              <Badge variant="outline" className="border-success/20 text-success-foreground dark:text-success">
                Match
              </Badge>
            </div>
            <p className="mt-2 text-body">
              <span className="font-medium text-muted-foreground">Evidence: </span>
              {item.evidence}
            </p>
            <p className="mt-1 text-body text-muted-foreground">
              <span className="font-medium">Why it matters: </span>
              {item.whyItMatters}
            </p>
          </li>
        ))}
      </ul>
    </ExpandableCard>
  );
}
