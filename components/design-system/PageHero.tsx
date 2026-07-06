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
    <header className={cn("wg-section-fade space-y-5", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          {greeting ? (
            <p className="text-body font-medium text-[var(--text-secondary)]">{greeting}</p>
          ) : null}
          <h1 className="text-heading-l text-[var(--text-primary)] sm:text-heading-xl">
            {title}
          </h1>
          <p className="max-w-2xl text-body text-[var(--text-secondary)]">
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
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-body",
                m.accent
                  ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                  : "bg-surface-primary ring-1 ring-[var(--border-default)]",
              )}
            >
              <span className="font-semibold tabular-nums">{m.value}</span>
              <span className="text-[var(--text-secondary)]">{m.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </header>
  );
}
