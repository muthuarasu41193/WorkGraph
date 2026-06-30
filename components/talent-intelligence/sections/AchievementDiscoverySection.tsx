"use client";

import type { CoachingQuestion } from "@/lib/talent-intelligence/types";
import ExpandableCard from "../shared/ExpandableCard";
import { MessageCircleQuestion } from "lucide-react";

type Props = { items: CoachingQuestion[] };

export default function AchievementDiscoverySection({ items }: Props) {
  if (!items.length) return null;

  return (
    <ExpandableCard
      title="Achievement Discovery"
      description="Coaching questions to uncover genuine accomplishments you may have overlooked."
      icon={<MessageCircleQuestion className="h-5 w-5 text-violet-600" />}
      defaultOpen={false}
    >
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li key={i} className="rounded-lg border border-violet-200/50 bg-violet-50/30 p-4 dark:border-violet-900/30 dark:bg-violet-950/20">
            <p className="font-medium">{item.question}</p>
            <p className="mt-2 text-sm text-muted-foreground">{item.context}</p>
            {item.relatedGap ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Related gap: {item.relatedGap}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </ExpandableCard>
  );
}
