"use client";

import type { CoachingQuestion } from "@/lib/talent-intelligence/types";
import ExpandableCard from "../shared/ExpandableCard";
import { MessageCircleQuestion } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";

type Props = { items: CoachingQuestion[] };

export default function AchievementDiscoverySection({ items }: Props) {
  if (!items.length) return null;

  return (
    <ExpandableCard
      title="Achievement Discovery"
      description="Coaching questions to uncover genuine accomplishments you may have overlooked."
      icon={<MessageCircleQuestion className={iconClass("inline", "text-accent")} />}
      defaultOpen={false}
    >
      <ul className="flex flex-col gap-[var(--layout-stack-group)]">
        {items.map((item, i) => (
          <li
            key={i}
            className="rounded-lg border border-accent-wash/50 bg-accent-wash/30 p-[var(--space-4)]"
          >
            <p className="text-role-card-title font-medium">{item.question}</p>
            <p className="mt-[var(--space-2)] text-role-body text-muted-foreground">{item.context}</p>
            {item.relatedGap ? (
              <p className="mt-[var(--space-1)] text-role-caption text-muted-foreground">
                Related gap: {item.relatedGap}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </ExpandableCard>
  );
}
