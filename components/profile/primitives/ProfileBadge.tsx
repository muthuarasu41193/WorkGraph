"use client";

import type { ReactNode } from "react";

type Tone = "default" | "success" | "warning" | "info" | "muted";

const toneStyles: Record<Tone, string> = {
  default: "bg-[var(--wg-color-surface-variant)] text-[var(--wg-color-text-secondary)] ring-[var(--wg-color-border)]",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-800 dark:text-amber-200 ring-amber-500/20",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-200 ring-blue-500/20",
  muted: "bg-neutral-500/10 text-[var(--wg-color-text-tertiary)] ring-neutral-500/15",
};

export default function ProfileBadge({
  children,
  tone = "default",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
        toneStyles[tone],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
