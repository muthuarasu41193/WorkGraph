"use client";

import { motion } from "framer-motion";
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
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("space-y-5", className)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          {greeting ? (
            <p className="text-sm font-medium text-[var(--dash-text-secondary)]">{greeting}</p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--dash-text)] sm:text-3xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--dash-text-secondary)]">
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
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                m.accent
                  ? "bg-[var(--dash-accent-soft)] text-[var(--dash-accent)]"
                  : "bg-white ring-1 ring-[var(--dash-border)]",
              )}
            >
              <span className="font-semibold tabular-nums">{m.value}</span>
              <span className="text-[var(--dash-text-secondary)]">{m.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </motion.header>
  );
}
