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
      icon={<ThumbsUp className="h-5 w-5 text-emerald-600" />}
    >
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li key={i} className="rounded-lg border border-emerald-200/60 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold">{item.title}</h4>
              <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:text-emerald-400">
                Match
              </Badge>
            </div>
            <p className="mt-2 text-sm">
              <span className="font-medium text-muted-foreground">Evidence: </span>
              {item.evidence}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-medium">Why it matters: </span>
              {item.whyItMatters}
            </p>
          </li>
        ))}
      </ul>
    </ExpandableCard>
  );
}
