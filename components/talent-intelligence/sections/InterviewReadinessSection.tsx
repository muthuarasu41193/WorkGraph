"use client";

import type { InterviewQuestion } from "@/lib/talent-intelligence/types";
import ExpandableCard from "../shared/ExpandableCard";
import { Mic } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";

type Props = { items: InterviewQuestion[] };

export default function InterviewReadinessSection({ items }: Props) {
  if (!items.length) return null;

  return (
    <ExpandableCard
      title="Interview Readiness"
      description="Likely questions based on resume gaps — and how to prepare honestly."
      icon={<Mic className={iconClass("inline", "text-primary")} />}
      defaultOpen={false}
    >
      <ul className="flex flex-col gap-[var(--layout-stack-group)]">
        {items.map((item, i) => (
          <li key={i} className="rounded-lg border p-[var(--space-4)]">
            <p className="text-role-card-title font-medium">{item.question}</p>
            <p className="mt-[var(--space-2)] text-role-body text-muted-foreground">
              <span className="font-medium text-foreground">Why they might ask: </span>
              {item.whyTheyMightAsk}
            </p>
            {item.relatedGap ? (
              <p className="mt-[var(--space-1)] text-role-caption text-muted-foreground">
                Gap: {item.relatedGap}
              </p>
            ) : null}
            <p className="mt-[var(--space-2)] rounded-md bg-primary/5 p-[var(--space-2)] text-role-body">
              <span className="font-medium">Prep tip: </span>
              {item.preparationTip}
            </p>
          </li>
        ))}
      </ul>
    </ExpandableCard>
  );
}
