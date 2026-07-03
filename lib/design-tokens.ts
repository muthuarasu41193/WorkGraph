/** WorkGraph design system tokens — 8px spacing, premium SaaS aesthetic */

export const WG_COLORS = {
  primary: "#B91C1C",
  primaryHover: "#991B1B",
  background: "#FAFAFA",
  surface: "#FFFFFF",
  border: "#ECECEC",
  text: "#111827",
  secondary: "#6B7280",
  success: "#10B981",
  warning: "#F59E0B",
  info: "#3B82F6",
} as const;

export const WG_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;

export const WG_SPACING = {
  unit: 8,
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
} as const;

export const WG_SHADOW = {
  sm: "0 1px 2px rgba(17, 24, 39, 0.04), 0 1px 3px rgba(17, 24, 39, 0.02)",
  md: "0 4px 12px rgba(17, 24, 39, 0.06), 0 2px 4px rgba(17, 24, 39, 0.03)",
  lg: "0 8px 24px rgba(17, 24, 39, 0.08), 0 4px 8px rgba(17, 24, 39, 0.04)",
} as const;

export const WG_TYPOGRAPHY = {
  display: "text-3xl sm:text-4xl font-semibold tracking-tight",
  heading: "text-xl sm:text-2xl font-semibold tracking-tight",
  title: "text-base font-semibold tracking-tight",
  body: "text-sm font-normal",
  caption: "text-xs font-medium text-[var(--wg-secondary)]",
} as const;

/** Neutral platform/source chips — no random brand colors in UI. */
export const WG_PLATFORM_CHIP_CLASS =
  "bg-gray-100 text-gray-700 ring-1 ring-gray-200/80 dark:bg-gray-800/50 dark:text-gray-200 dark:ring-gray-600/40";
