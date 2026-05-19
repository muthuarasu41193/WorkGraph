"use client";

import type { ComponentType } from "react";
import { motion } from "framer-motion";
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
    <ProfileCard className="relative overflow-hidden" padding="lg">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[var(--wg-color-primary)]/10 blur-3xl" />

      <SectionHeader
        icon={Brain}
        eyebrow="AI coach"
        title="Career intelligence"
        description="Personalized recommendations based on your profile and market signals."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightBlock title="Missing skills" items={data.missingSkills} icon={Sparkles} />
        <InsightBlock title="Recommended certifications" items={data.certifications} icon={BadgeDollarSign} />
        <InsightBlock title="Resume improvements" items={data.resumeTips} icon={LineChart} />
        <InsightBlock title="Career growth" items={data.careerGrowth} icon={TrendingUp} />
      </div>

      <motion.div
        className="mt-6 grid gap-3 sm:grid-cols-2"
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="rounded-xl bg-[var(--wg-color-surface-variant)] p-4 ring-1 ring-[var(--wg-color-border)]">
          <p className="text-xs font-medium text-[var(--wg-color-text-tertiary)]">Industry demand</p>
          <p className="mt-1 text-lg font-semibold text-[var(--wg-color-text-primary)]">
            {data.industryDemand.trend}{" "}
            <span className="text-sm font-normal text-[var(--wg-color-text-secondary)]">
              {data.industryDemand.label}
            </span>
          </p>
          <p className="text-xs text-[var(--wg-color-text-tertiary)]">Last {data.industryDemand.period}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-[var(--wg-color-primary)]/15 to-transparent p-4 ring-1 ring-[var(--wg-color-primary)]/20">
          <p className="text-xs font-medium text-[var(--wg-color-text-tertiary)]">Salary insight</p>
          <p className="mt-1 text-lg font-semibold text-[var(--wg-color-text-primary)]">{data.salaryInsight.range}</p>
          <p className="text-xs text-[var(--wg-color-text-secondary)]">
            {data.salaryInsight.location} · {data.salaryInsight.percentile} percentile
          </p>
        </div>
      </motion.div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--wg-color-border)] px-4 py-3">
        <span className="text-sm text-[var(--wg-color-text-secondary)]">AI profile strength</span>
        <ProfileBadge tone="success">{data.strengthScore}% strong</ProfileBadge>
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
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-xl border border-[var(--wg-color-border)] p-4"
    >
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--wg-color-text-primary)]">
        <Icon className="h-4 w-4 text-[var(--wg-color-primary)]" />
        {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-[var(--wg-color-text-secondary)]">
            <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--wg-color-primary)]" />
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
