"use client";

import type { RecruiterExpectation } from "@/lib/talent-intelligence/types";
import ExpandableCard from "../shared/ExpandableCard";
import { Users } from "lucide-react";

type Props = { items: RecruiterExpectation[] };

export default function RecruiterExpectationsSection({ items }: Props) {
  if (!items.length) return null;

  return (
    <ExpandableCard
      title="Recruiter Expectations"
      description="What recruiters typically look for and how candidates demonstrate it."
      icon={<Users className="h-5 w-5 text-primary" />}
    >
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li key={i} className="rounded-lg border p-4">
            <h4 className="font-semibold">{item.expectation}</h4>
            <p className="mt-2 text-sm">
              <span className="font-medium text-muted-foreground">Why recruiters care: </span>
              {item.whyRecruitersCare}
            </p>
            <p className="mt-1 text-sm">
              <span className="font-medium text-muted-foreground">How to demonstrate: </span>
              {item.howCandidatesDemonstrate}
            </p>
          </li>
        ))}
      </ul>
    </ExpandableCard>
  );
}
