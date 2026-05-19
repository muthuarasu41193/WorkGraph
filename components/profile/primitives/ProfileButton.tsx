"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";

type ProfileButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
  icon?: ReactNode;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--wg-color-primary)] text-white hover:brightness-105 shadow-[0_1px_2px_rgba(26,115,232,0.25)] active:scale-[0.98]",
  secondary:
    "bg-[var(--wg-color-surface-variant)] text-[var(--wg-color-text-primary)] ring-1 ring-[var(--wg-color-border)] hover:bg-[var(--wg-color-border)]/30 active:scale-[0.98]",
  ghost:
    "text-[var(--wg-color-text-secondary)] hover:bg-[var(--wg-color-surface-variant)] active:scale-[0.98]",
  outline:
    "ring-1 ring-[var(--wg-color-border)] text-[var(--wg-color-text-primary)] hover:bg-[var(--wg-color-surface-variant)] active:scale-[0.98]",
};

export default function ProfileButton({
  variant = "primary",
  children,
  icon,
  className = "",
  ...props
}: ProfileButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wg-color-primary)] focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
