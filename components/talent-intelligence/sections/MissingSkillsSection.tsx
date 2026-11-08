"use client";

import type { MissingSkills } from "@/lib/talent-intelligence/types";
import { Badge } from "@/components/ui/badge";
import ExpandableCard from "../shared/ExpandableCard";
import { AlertTriangle } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";

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
    <div className="flex flex-col gap-[var(--space-3)]">
      <h4 className="flex items-center gap-[var(--space-2)] text-role-card-title font-semibold">
        <Badge variant={variant}>{title}</Badge>
        <span className="text-role-caption text-muted-foreground">({items.length})</span>
      </h4>
      <ul className="flex flex-col gap-[var(--space-3)]">
        {items.map((item, i) => (
          <li
            key={i}
            className="rounded-lg border bg-muted/20 p-[var(--space-3)] text-role-body"
          >
            <p className="font-medium">{item.skill}</p>
            <p className="mt-[var(--space-1)] text-muted-foreground">{item.explanation}</p>
            <p className="mt-[var(--space-2)] rounded-md bg-primary/5 p-[var(--space-2)] text-role-caption">
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
      icon={<AlertTriangle className={iconClass("inline", "text-caution")} />}
    >
      <div className="flex flex-col gap-[var(--space-6)]">
        <SkillTier title="Critical" variant="destructive" items={data.critical} />
        <SkillTier title="Important" variant="secondary" items={data.important} />
        <SkillTier title="Nice to Have" variant="outline" items={data.niceToHave} />
      </div>
    </ExpandableCard>
  );
}
