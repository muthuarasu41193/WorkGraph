"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MetricPill = {
  label: string;
  value: string | number;
  accent?: boolean;
};

type Props = {
  greeting?: string;
  title: string;
  subtitle: string;
  metrics?: MetricPill[];
  cta?: ReactNode;
  className?: string;
};

export default function PageHero({
  greeting,
  title,
  subtitle,
  metrics,
  cta,
  className,
}: Props) {
  return (
    <header className={cn("wg-section-fade flex flex-col gap-[var(--layout-section-title-gap)]", className)}>
      <div className="flex flex-col gap-[var(--space-3)] sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-[var(--layout-stack-tight)]">
          {greeting ? (
            <p className="text-role-caption text-ink-subtle">{greeting}</p>
          ) : null}
          <h1 className="text-role-title">{title}</h1>
          <p className="measure text-role-body-lg text-ink-muted">{subtitle}</p>
        </div>
        {cta ? <div className="shrink-0">{cta}</div> : null}
      </div>

      {metrics && metrics.length > 0 ? (
        <div className="flex flex-wrap gap-[var(--space-2)]">
          {metrics.map((m) => (
            <div
              key={m.label}
              className={cn(
                "inline-flex items-center gap-[var(--space-2)] rounded-[var(--radius-tag)] px-[var(--space-3)] py-[var(--space-1)] text-role-caption",
                m.accent
                  ? "bg-[var(--dash-accent-soft)] text-[var(--dash-accent)]"
                  : "bg-surface border border-hairline",
              )}
            >
              <span className="font-semibold tabular-nums text-ink">{m.value}</span>
              <span className="text-ink-muted">{m.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </header>
  );
}
