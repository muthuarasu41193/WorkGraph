"use client";

import type { StrengthItem } from "@/lib/talent-intelligence/types";
import { Badge } from "@/components/ui/badge";
import ExpandableCard from "../shared/ExpandableCard";
import { ThumbsUp } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";

type Props = { items: StrengthItem[] };

export default function StrengthsSection({ items }: Props) {
  if (!items.length) return null;

  return (
    <ExpandableCard
      title="Strengths"
      description="What aligns well with this role and why it matters."
      icon={<ThumbsUp className={iconClass("inline", "text-positive")} />}
    >
      <ul className="flex flex-col gap-[var(--layout-stack-group)]">
        {items.map((item, i) => (
          <li
            key={i}
            className="rounded-lg border border-positive-wash/60 bg-positive-wash/50 p-[var(--space-4)]"
          >
            <div className="flex flex-wrap items-center gap-[var(--space-2)]">
              <h4 className="text-role-card-title font-semibold">{item.title}</h4>
              <Badge variant="outline" className="border-positive text-positive">
                Match
              </Badge>
            </div>
            <p className="mt-[var(--space-2)] text-role-body">
              <span className="font-medium text-muted-foreground">Evidence: </span>
              {item.evidence}
            </p>
            <p className="mt-[var(--space-1)] text-role-body text-muted-foreground">
              <span className="font-medium">Why it matters: </span>
              {item.whyItMatters}
            </p>
          </li>
        ))}
      </ul>
    </ExpandableCard>
  );
}
