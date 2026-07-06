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
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] p-4">
          <p className="text-caption font-medium text-[var(--text-tertiary)]">Industry demand</p>
          <p className="mt-1 text-body-lg font-semibold text-[var(--text-primary)]">
            {data.industryDemand.trend}{" "}
            <span className="text-body font-normal text-[var(--text-secondary)]">
              {data.industryDemand.label}
            </span>
          </p>
          <p className="mt-1 text-caption text-[var(--text-tertiary)]">Last {data.industryDemand.period}</p>
        </div>
        <div className="rounded-lg border border-[var(--border-default)] p-4">
          <p className="text-caption font-medium text-[var(--text-tertiary)]">Salary insight</p>
          <p className="mt-1 text-body-lg font-semibold text-[var(--text-primary)]">{data.salaryInsight.range}</p>
          <p className="mt-1 text-caption text-[var(--text-secondary)]">
            {data.salaryInsight.location} · {data.salaryInsight.percentile} percentile
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-[var(--border-default)] px-4 py-3">
        <span className="text-body font-medium text-[var(--text-primary)]">Profile strength score</span>
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
    <div className="rounded-lg border border-[var(--border-default)] p-4">
      <p className="mb-2 flex items-center gap-2 text-body font-semibold text-[var(--text-primary)]">
        <Icon className="h-4 w-4 text-[var(--text-tertiary)]" strokeWidth={1.75} />
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-body font-medium text-[var(--text-primary)]">
            <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
