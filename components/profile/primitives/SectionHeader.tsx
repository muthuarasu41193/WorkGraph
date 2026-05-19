"use client";

import { motion } from "framer-motion";
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
    <header className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-3">
        {Icon ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--wg-color-surface-variant)] text-[var(--wg-color-primary)] ring-1 ring-[var(--wg-color-border)]">
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
          </span>
        ) : null}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="min-w-0"
        >
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--wg-color-text-tertiary)]">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-lg font-semibold tracking-tight text-[var(--wg-color-text-primary)] sm:text-xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-[var(--wg-color-text-secondary)]">
              {description}
            </p>
          ) : null}
        </motion.div>
      </div>
      {action ? <motion.div className="shrink-0">{action}</motion.div> : null}
    </header>
  );
}
