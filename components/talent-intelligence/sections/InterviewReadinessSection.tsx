"use client";

import type { InterviewQuestion } from "@/lib/talent-intelligence/types";
import ExpandableCard from "../shared/ExpandableCard";
import { Mic } from "lucide-react";

type Props = { items: InterviewQuestion[] };

export default function InterviewReadinessSection({ items }: Props) {
  if (!items.length) return null;

  return (
    <ExpandableCard
      title="Interview Readiness"
      description="Likely questions based on resume gaps — and how to prepare honestly."
      icon={<Mic className="h-5 w-5 text-primary" />}
      defaultOpen={false}
    >
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li key={i} className="rounded-lg border p-4">
            <p className="font-medium">{item.question}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Why they might ask: </span>
              {item.whyTheyMightAsk}
            </p>
            {item.relatedGap ? (
              <p className="mt-1 text-xs text-muted-foreground">Gap: {item.relatedGap}</p>
            ) : null}
            <p className="mt-2 rounded-md bg-primary/5 p-2 text-sm">
              <span className="font-medium">Prep tip: </span>
              {item.preparationTip}
            </p>
          </li>
        ))}
      </ul>
    </ExpandableCard>
  );
}
