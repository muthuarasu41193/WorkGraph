"use client";

import type { CareerInsights } from "@/lib/talent-intelligence/types";
import { Badge } from "@/components/ui/badge";
import ExpandableCard from "../shared/ExpandableCard";
import { GraduationCap } from "lucide-react";

type Props = { data: CareerInsights };

function Tier({ title, items }: { title: string; items: CareerInsights["immediate"] }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="mt-2 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="rounded-lg border p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{item.item}</span>
              <Badge variant="outline" className="text-xs capitalize">
                {item.type}
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground">{item.rationale}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CareerInsightsSection({ data }: Props) {
  const hasAny =
    data.immediate.length ||
    data.threeMonths.length ||
    data.sixMonths.length ||
    data.longTerm.length;

  if (!hasAny) return null;

  return (
    <ExpandableCard
      title="Career Insights"
      description="Learning recommendations only when genuinely relevant to your gaps."
      icon={<GraduationCap className="h-5 w-5 text-primary" />}
      defaultOpen={false}
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Tier title="Immediate" items={data.immediate} />
        <Tier title="3 Months" items={data.threeMonths} />
        <Tier title="6 Months" items={data.sixMonths} />
        <Tier title="Long-term" items={data.longTerm} />
      </div>
    </ExpandableCard>
  );
}
