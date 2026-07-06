"use client";

import type { RecruiterView } from "@/lib/talent-intelligence/types";
import { Badge } from "@/components/ui/badge";
import ExpandableCard from "../shared/ExpandableCard";
import { Eye } from "lucide-react";

type Props = { data: RecruiterView };

export default function RecruiterViewSection({ data }: Props) {
  return (
    <ExpandableCard
      title="Recruiter View"
      description="How an experienced recruiter might react to your resume for this role."
      icon={<Eye className="h-5 w-5 text-primary" />}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant={data.wouldShortlist ? "default" : "secondary"}>
          {data.wouldShortlist ? "Likely shortlist" : "Unlikely shortlist"}
        </Badge>
      </div>
      <p className="mb-4 text-sm">{data.shortlistReasoning}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-success-foreground dark:text-success">Stands out</h4>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
            {data.standsOut.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-warning-foreground dark:text-warning">Concerns</h4>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
            {data.concerns.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Missing evidence</h4>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
            {data.missingEvidence.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Proof requested</h4>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
            {data.proofRequested.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      </div>
    </ExpandableCard>
  );
}
