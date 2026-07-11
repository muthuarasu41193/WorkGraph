/** WorkGraph design system tokens — 8px spacing, premium SaaS aesthetic */

export const WG_COLORS = {
  primary: "#DC2626",
  primaryHover: "#C62222",
  background: "#FFFFFF",
  backgroundSecondary: "#F7FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  borderHover: "#CBD1D8",
  text: "#1A1A1A",
  textSecondary: "#4A5568",
  textMuted: "#718096",
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
  /** Tailwind scale: 4px increments */
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
  unit: 8,
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
} as const;

export const WG_LAYOUT = {
  page: "space-y-8",
  pageLg: "space-y-12",
  section: "mb-8",
  sectionLg: "mb-12",
  sectionStack: "space-y-4",
  sectionStackLg: "space-y-6",
  componentGap: "gap-4",
  componentGapLg: "gap-6",
  grid: "grid gap-4",
  gridLg: "grid gap-6",
  card: "p-6",
  flexRow: "flex gap-4",
} as const;

export const WG_SHADOW = {
  sm: "var(--wg-shadow-sm)",
  DEFAULT: "var(--wg-shadow)",
  md: "var(--wg-shadow-md)",
  lg: "var(--wg-shadow-lg)",
} as const;

export { WG_ICON, ICON_STROKE_WIDTH, iconClass } from "./icon-styles";

export const WG_TYPOGRAPHY = {
  fontFamily: "font-sans",
  colors: {
    heading: "#1a1a1a",
    body: "#4a5568",
    secondary: "#718096",
    muted: "#718096",
  },
  leading: {
    body: 1.5,
    heading: 1.2,
  },
  tracking: {
    heading: "-0.01em",
  },
  display:
    "text-3xl sm:text-4xl font-bold leading-heading tracking-heading text-wg-heading",
  heading: "text-xl sm:text-2xl font-semibold leading-heading tracking-heading text-wg-heading",
  title: "text-base font-semibold leading-heading tracking-heading text-wg-heading",
  body: "text-base font-normal leading-body text-wg-body",
  bodySm: "text-sm font-normal leading-body text-wg-body",
  secondary: "text-sm font-normal leading-body text-wg-secondary",
  caption: "text-xs font-normal leading-body text-wg-secondary",
} as const;

export const WG_MOTION = {
  interactive: "transition-all duration-200 ease-in-out",
  button: "transition-all duration-200 ease-in-out enabled:hover:scale-[1.02]",
  card: "transition-all duration-200 ease-in-out hover:-translate-y-0.5",
  link: "transition-all duration-200 ease-in-out hover:underline underline-offset-4",
} as const;

export const WG_BUTTON = {
  primary: "bg-red-600 text-white font-medium px-6 py-2.5 rounded-lg shadow-sm",
  secondary: "bg-white text-gray-700 border border-gray-300 font-medium px-6 py-2.5 rounded-lg",
  hover: "transition-all duration-200 ease-in-out enabled:hover:scale-[1.02] enabled:hover:shadow",
  focus: "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500",
  disabled: "disabled:opacity-50 disabled:cursor-not-allowed",
  primaryFull:
    "inline-flex items-center justify-center bg-red-600 text-white font-medium px-6 py-2.5 rounded-lg shadow-sm transition-all duration-200 ease-in-out enabled:hover:scale-[1.02] enabled:hover:bg-[var(--wg-primary-hover)] enabled:hover:shadow focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed",
  secondaryFull:
    "inline-flex items-center justify-center bg-white text-gray-700 border border-gray-300 font-medium px-6 py-2.5 rounded-lg transition-all duration-200 ease-in-out enabled:hover:scale-[1.02] enabled:hover:bg-[var(--wg-bg-secondary)] enabled:hover:shadow enabled:hover:border-[var(--wg-border-hover)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed",
} as const;

export const WG_CARD = {
  base: "rounded-xl border border-[var(--wg-border)] bg-white p-6 shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-[var(--wg-border-hover)] hover:shadow-md",
  title: "text-lg font-semibold leading-[1.2] tracking-[-0.01em] text-[var(--wg-text-primary)]",
  description: "text-sm text-[var(--wg-text-muted)]",
} as const;

export const WG_FORM = {
  field:
    "w-full rounded-lg border border-[var(--wg-border)] bg-white px-4 py-2.5 font-sans text-sm font-normal transition-all duration-200 ease-in-out placeholder:text-[var(--wg-placeholder)] focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-red-100 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-[var(--wg-bg-secondary)] disabled:opacity-50",
  label: "text-sm font-medium text-[var(--wg-text-secondary)]",
} as const;

export const WG_NAV = {
  shell: "bg-white border-r border-[var(--wg-border)]",
  item: "flex items-center gap-3 rounded-lg border-l-4 border-transparent px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 ease-in-out hover:bg-[var(--wg-bg-secondary)]",
  itemActive: "border-l-red-600 bg-red-50 text-red-600 hover:bg-red-100",
  icon: "size-5 shrink-0",
} as const;

/** Neutral platform/source chips — no random brand colors in UI. */
export const WG_PLATFORM_CHIP_CLASS =
  "bg-gray-100 text-gray-700 ring-1 ring-gray-200/80 dark:bg-gray-800/50 dark:text-gray-200 dark:ring-gray-600/40";
