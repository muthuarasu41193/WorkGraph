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
    <header className={cn("wg-section-fade space-y-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          {greeting ? (
            <p className="text-[13px] font-medium text-fg-secondary">{greeting}</p>
          ) : null}
          <h1 className="font-semibold tracking-heading text-fg-primary text-[clamp(1.25rem,3vw,1.625rem)]">
            {title}
          </h1>
          <p className="max-w-2xl text-[13.5px] leading-relaxed text-fg-secondary">
            {subtitle}
          </p>
        </div>
        {cta ? <div className="shrink-0">{cta}</div> : null}
      </div>

      {metrics && metrics.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {metrics.map((m) => (
            <div
              key={m.label}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px]",
                m.accent
                  ? "bg-[var(--dash-accent-soft)] text-[var(--dash-accent)]"
                  : "bg-surface ring-1 ring-[var(--dash-border)]",
              )}
            >
              <span className="font-semibold tabular-nums text-fg-primary">{m.value}</span>
              <span className="text-fg-secondary">{m.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </header>
  );
}
