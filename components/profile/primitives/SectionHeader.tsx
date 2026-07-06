"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type SectionHeaderProps = {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
}: SectionHeaderProps) {
  return (
    <header className="mb-5 flex flex-col gap-3 border-b border-[var(--border-default)] pb-5 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="wg-label-mono mb-1">{eyebrow}</p>
        ) : null}
        <div className="flex items-center gap-3">
          {Icon ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] text-[var(--text-secondary)]">
              <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </span>
          ) : null}
          <h2 className="text-body-lg font-semibold tracking-tight text-[var(--text-primary)] sm:text-heading-s">
            {title}
          </h2>
        </div>
        {description ? (
          <p
            className={[
              "mt-2 max-w-prose text-body text-[var(--text-primary)]/80",
              Icon ? "sm:pl-[2.625rem]" : "",
            ].join(" ")}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 sm:pb-1">{action}</div> : null}
    </header>
  );
}
