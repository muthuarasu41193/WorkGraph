"use client";

import type { MissingSkills } from "@/lib/talent-intelligence/types";
import { Badge } from "@/components/ui/badge";
import ExpandableCard from "../shared/ExpandableCard";
import { AlertTriangle } from "lucide-react";

type Props = { data: MissingSkills };

function SkillTier({
  title,
  variant,
  items,
}: {
  title: string;
  variant: "destructive" | "secondary" | "outline";
  items: MissingSkills["critical"];
}) {
  if (!items.length) return null;
  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        <Badge variant={variant}>{title}</Badge>
        <span className="text-muted-foreground">({items.length})</span>
      </h4>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="rounded-lg border bg-muted/20 p-3 text-sm">
            <p className="font-medium">{item.skill}</p>
            <p className="mt-1 text-muted-foreground">{item.explanation}</p>
            <p className="mt-2 rounded-md bg-primary/5 p-2 text-xs">
              {item.howToDemonstrateIfYouHaveIt}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MissingSkillsSection({ data }: Props) {
  const total = data.critical.length + data.important.length + data.niceToHave.length;
  if (!total) return null;

  return (
    <ExpandableCard
      title="Missing Skills"
      description="Gaps identified — only highlight skills you genuinely possess."
      icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
    >
      <div className="space-y-6">
        <SkillTier title="Critical" variant="destructive" items={data.critical} />
        <SkillTier title="Important" variant="secondary" items={data.important} />
        <SkillTier title="Nice to Have" variant="outline" items={data.niceToHave} />
      </div>
    </ExpandableCard>
  );
}
