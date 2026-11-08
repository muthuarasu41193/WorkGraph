"use client";

import type { RecruiterExpectation } from "@/lib/talent-intelligence/types";
import ExpandableCard from "../shared/ExpandableCard";
import { Users } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";

type Props = { items: RecruiterExpectation[] };

export default function RecruiterExpectationsSection({ items }: Props) {
  if (!items.length) return null;

  return (
    <ExpandableCard
      title="Recruiter Expectations"
      description="What recruiters typically look for and how candidates demonstrate it."
      icon={<Users className={iconClass("inline", "text-primary")} />}
    >
      <ul className="flex flex-col gap-[var(--layout-stack-group)]">
        {items.map((item, i) => (
          <li key={i} className="rounded-lg border p-[var(--space-4)]">
            <h4 className="text-role-card-title font-semibold">{item.expectation}</h4>
            <p className="mt-[var(--space-2)] text-role-body">
              <span className="font-medium text-muted-foreground">Why recruiters care: </span>
              {item.whyRecruitersCare}
            </p>
            <p className="mt-[var(--space-1)] text-role-body">
              <span className="font-medium text-muted-foreground">How to demonstrate: </span>
              {item.howCandidatesDemonstrate}
            </p>
          </li>
        ))}
      </ul>
    </ExpandableCard>
  );
}
