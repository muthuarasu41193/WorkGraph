"use client";

import type { RecruiterView } from "@/lib/talent-intelligence/types";
import { Badge } from "@/components/ui/badge";
import ExpandableCard from "../shared/ExpandableCard";
import { Eye } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";

type Props = { data: RecruiterView };

export default function RecruiterViewSection({ data }: Props) {
  return (
    <ExpandableCard
      title="Recruiter View"
      description="How an experienced recruiter might react to your resume for this role."
      icon={<Eye className={iconClass("inline", "text-primary")} />}
    >
      <div className="mb-[var(--space-4)] flex flex-wrap items-center gap-[var(--space-2)]">
        <Badge variant={data.wouldShortlist ? "default" : "secondary"}>
          {data.wouldShortlist ? "Likely shortlist" : "Unlikely shortlist"}
        </Badge>
      </div>
      <p className="mb-[var(--space-4)] text-role-body">{data.shortlistReasoning}</p>

      <div className="grid gap-[var(--layout-card-gap)] sm:grid-cols-2">
        <div>
          <h4 className="text-role-card-title font-semibold text-positive">Stands out</h4>
          <ul className="mt-[var(--space-2)] list-disc space-y-[var(--space-1)] pl-[var(--space-4)] text-role-body">
            {data.standsOut.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-role-card-title font-semibold text-caution">Concerns</h4>
          <ul className="mt-[var(--space-2)] list-disc space-y-[var(--space-1)] pl-[var(--space-4)] text-role-body">
            {data.concerns.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-role-card-title font-semibold">Missing evidence</h4>
          <ul className="mt-[var(--space-2)] list-disc space-y-[var(--space-1)] pl-[var(--space-4)] text-role-body text-muted-foreground">
            {data.missingEvidence.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-role-card-title font-semibold">Proof requested</h4>
          <ul className="mt-[var(--space-2)] list-disc space-y-[var(--space-1)] pl-[var(--space-4)] text-role-body text-muted-foreground">
            {data.proofRequested.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      </div>
    </ExpandableCard>
  );
}
