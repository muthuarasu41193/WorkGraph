/**
 * Reusable Tailwind class bundles composed from design tokens.
 * Prefer these over ad-hoc utility strings in feature components.
 */

/** Platform/source chips — neutral, no brand colors */
export const platformChipClass =
  "bg-surface-secondary text-text-secondary ring-1 ring-border-default";

/** Dashboard section card */
export const sectionCardClass =
  "wg-section-card rounded-[length:var(--radius-lg)] border border-border bg-surface-primary shadow-[var(--shadow-sm)] transition-[var(--transition-shadow)] hover:shadow-[var(--shadow-md)]";

/** Profile card with accent bar */
export const profileCardClass =
  "wg-profile-card rounded-[length:var(--radius-lg)] border border-border bg-surface-primary shadow-[var(--shadow-sm)] transition-[var(--transition-shadow)] hover:shadow-[var(--shadow-md)] border-l-[3px] border-l-primary";

/** Nav active state */
export const navActiveClass =
  "bg-[var(--accent-subtle)] text-primary shadow-[inset_3px_0_0_0_var(--accent)]";

/** Semantic status badges */
export const statusBadge = {
  success: "border border-success/20 bg-success-subtle text-success-foreground",
  warning: "border border-warning/20 bg-warning-subtle text-warning-foreground",
  danger: "border border-danger/20 bg-danger-subtle text-danger-foreground",
  info: "border border-info/20 bg-info-subtle text-info-foreground",
  neutral: "border border-border bg-surface-secondary text-text-secondary",
} as const;

/** Match score tiers */
export const matchScoreClass = {
  high: "bg-success-subtle text-success-foreground",
  medium: "bg-warning-subtle text-warning-foreground",
  low: "bg-info-subtle text-info-foreground",
  none: "bg-surface-secondary text-text-tertiary",
} as const;

/** Filter chip active/inactive */
export const filterChipClass = {
  base: "inline-flex h-10 cursor-pointer items-center gap-1 rounded-[length:var(--radius-full)] border px-4 text-body transition-[var(--transition-colors)] focus-visible:outline-none focus-visible:ring-[length:var(--focus-ring-width)] focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-[length:var(--focus-ring-offset)]",
  inactive: "border-border bg-surface-primary text-text-secondary hover:border-border-strong hover:bg-[var(--interactive-hover)]",
  active: "border-primary bg-primary text-primary-foreground",
} as const;

/** Sticky filter bar */
export const stickyBarClass =
  "sticky top-[var(--header-height)] z-[100] border-b border-border bg-surface-primary/95 py-3 backdrop-blur-[8px]";

/** Input field default — mirrors @/components/ui/input (md) */
export const inputFieldClass =
  "h-[var(--input-height-md)] w-full rounded-[length:var(--radius-md)] border border-input bg-[var(--surface-primary)] px-3 text-body text-foreground placeholder:text-muted-foreground outline-none transition-[var(--transition-colors)] focus-visible:border-[var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)]/20 focus-visible:shadow-[var(--shadow-sm)]";
