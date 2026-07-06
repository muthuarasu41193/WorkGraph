"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  icon: LucideIcon;
  score?: string | number;
  badge?: string;
  action?: ReactNode;
  variant?: "default" | "accent" | "success";
  className?: string;
};

const variantStyles = {
  default: "bg-surface-primary",
  accent: "bg-gradient-to-br from-white to-red-50/40",
  success: "bg-gradient-to-br from-surface-primary to-success-subtle/40",
};

export default function InsightCard({
  title,
  description,
  icon: Icon,
  score,
  badge,
  action,
  variant = "default",
  className,
}: Props) {
  return (
    <div
      className={cn(
        "wg-dash-section-card wg-dash-card-lift flex flex-col p-5",
        variantStyles[variant],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)]">
          <Icon className="h-[17px] w-[17px]" aria-hidden />
        </span>
        {badge ? (
          <span className="rounded-md bg-surface-secondary px-2 py-0.5 text-caption font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex-1 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-body font-semibold text-[var(--text-primary)]">{title}</h3>
          {score !== undefined ? (
            <span className="text-heading-s tabular-nums text-[var(--accent)]">
              {score}
            </span>
          ) : null}
        </div>
        <p className="text-caption leading-relaxed text-[var(--text-secondary)]">{description}</p>
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
