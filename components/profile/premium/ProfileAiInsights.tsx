"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  BadgeDollarSign,
  Brain,
  LineChart,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { MOCK_AI_INSIGHTS } from "../../../lib/profile-mock-data";
import ProfileCard from "../primitives/ProfileCard";
import ProfileBadge from "../primitives/ProfileBadge";
import SectionHeader from "../primitives/SectionHeader";

export default function ProfileAiInsights() {
  const data = MOCK_AI_INSIGHTS;

  return (
    <ProfileCard padding="lg">
      <SectionHeader
        icon={Brain}
        eyebrow="Insights"
        title="Career intelligence"
        description="Recommendations based on your profile and market signals."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <InsightBlock title="Missing skills" items={data.missingSkills} icon={Sparkles} />
        <InsightBlock title="Recommended certifications" items={data.certifications} icon={BadgeDollarSign} />
        <InsightBlock title="Resume improvements" items={data.resumeTips} icon={LineChart} />
        <InsightBlock title="Career growth" items={data.careerGrowth} icon={TrendingUp} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--wg-color-border)] bg-[var(--wg-color-surface-variant)] p-4">
          <p className="text-xs font-medium text-[var(--wg-color-text-tertiary)]">Industry demand</p>
          <p className="mt-1 text-base font-semibold text-[var(--wg-color-text-primary)]">
            {data.industryDemand.trend}{" "}
            <span className="text-sm font-normal text-[var(--wg-color-text-secondary)]">
              {data.industryDemand.label}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-[var(--wg-color-text-tertiary)]">Last {data.industryDemand.period}</p>
        </div>
        <div className="rounded-lg border border-[var(--wg-color-border)] p-4">
          <p className="text-xs font-medium text-[var(--wg-color-text-tertiary)]">Salary insight</p>
          <p className="mt-1 text-base font-semibold text-[var(--wg-color-text-primary)]">{data.salaryInsight.range}</p>
          <p className="mt-0.5 text-xs text-[var(--wg-color-text-secondary)]">
            {data.salaryInsight.location} · {data.salaryInsight.percentile} percentile
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-[var(--wg-color-border)] px-4 py-3">
        <span className="text-sm font-medium text-[var(--wg-color-text-primary)]">Profile strength score</span>
        <ProfileBadge tone="success">{data.strengthScore}%</ProfileBadge>
      </div>
    </ProfileCard>
  );
}

function InsightBlock({
  title,
  items,
  icon: Icon,
}: {
  title: string;
  items: string[];
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-[var(--wg-color-border)] p-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--wg-color-text-primary)]">
        <Icon className="h-4 w-4 text-[var(--wg-color-text-tertiary)]" strokeWidth={1.75} />
        {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm font-medium text-[var(--wg-color-text-primary)]">
            <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--wg-color-primary)]" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
