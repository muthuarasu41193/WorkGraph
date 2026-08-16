/** WorkGraph design system tokens — professional SaaS visual language */

export const WG_COLORS = {
  brand: {
    50: "#FEF2F3",
    100: "#FDE3E5",
    200: "#FBCBD0",
    300: "#F8A3AB",
    400: "#F2707C",
    500: "#E83D4D",
    600: "#E11D2E",
    700: "#BE1528",
    800: "#9D1626",
    900: "#821822",
    950: "#480A12",
  },
  primary: "#E11D2E",
  primaryHover: "#BE1528",
  background: "#F8FAFC",
  backgroundSecondary: "#F1F5F9",
  surface: "#FFFFFF",
  surfaceHover: "#F8FAFC",
  surfaceActive: "#F1F5F9",
  border: "#E2E8F0",
  borderDefault: "#E2E8F0",
  borderStrong: "#CBD5E1",
  borderHover: "#CBD5E1",
  text: "#0F172A",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textTertiary: "#94A3B8",
  textMuted: "#94A3B8",
  success: "#10B981",
  warning: "#F59E0B",
  info: "#3B82F6",
} as const;

export const WG_RADIUS = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
} as const;

export const WG_SPACING = {
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
  buttonX: 16,
  buttonY: 10,
  card: 20,
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
  card: "p-5",
  flexRow: "flex gap-4",
} as const;

export const WG_SHADOW = {
  xs: "var(--wg-shadow-xs)",
  sm: "var(--wg-shadow-sm)",
  DEFAULT: "var(--wg-shadow)",
  md: "var(--wg-shadow-md)",
  lg: "var(--wg-shadow-lg)",
  brand: "var(--wg-shadow-brand)",
} as const;

export { WG_ICON, ICON_STROKE_WIDTH, iconClass } from "./icon-styles";

export const WG_TYPOGRAPHY = {
  fontFamily: "font-sans",
  headingFamily: "font-heading",
  numericFamily: "font-numeric",
  colors: {
    heading: "var(--wg-text-primary)",
    body: "var(--wg-text-secondary)",
    secondary: "var(--wg-text-secondary)",
    muted: "var(--wg-text-tertiary)",
  },
  leading: {
    body: 1.5,
    heading: 1.2,
  },
  tracking: {
    body: "-0.005em",
    heading: "-0.01em",
  },
  display:
    "text-3xl sm:text-4xl font-bold leading-heading tracking-heading text-fg-primary",
  heading: "text-xl sm:text-2xl font-semibold leading-heading tracking-heading text-fg-primary",
  title: "text-base font-semibold leading-heading tracking-heading text-fg-primary",
  body: "text-base font-normal leading-body tracking-body text-fg-secondary",
  bodySm: "text-sm font-normal leading-body tracking-body text-fg-secondary",
  secondary: "text-sm font-normal leading-body text-fg-secondary",
  caption: "text-xs font-normal leading-body text-fg-tertiary",
  numeric: "font-numeric tabular-nums",
} as const;

export const WG_MOTION = {
  interactive: "transition-all duration-200 ease-in-out",
  button: "transition-all duration-200 ease-in-out enabled:hover:scale-[1.02]",
  card: "transition-all duration-200 ease-in-out hover:-translate-y-0.5",
  link: "transition-all duration-200 ease-in-out hover:underline underline-offset-4",
} as const;

export const WG_BUTTON = {
  primary: "bg-brand text-white font-medium px-4 py-2.5 rounded-md shadow-brand",
  secondary: "bg-surface text-fg-secondary border border-border-default font-medium px-4 py-2.5 rounded-md",
  hover: "transition-all duration-200 ease-in-out enabled:hover:scale-[1.02] enabled:hover:shadow-md",
  focus: "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand",
  disabled: "disabled:opacity-50 disabled:cursor-not-allowed",
  primaryFull:
    "inline-flex items-center justify-center bg-brand text-white font-medium px-4 py-2.5 rounded-md shadow-brand transition-all duration-200 ease-in-out enabled:hover:scale-[1.02] enabled:hover:bg-brand-700 enabled:hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand disabled:opacity-50 disabled:cursor-not-allowed",
  secondaryFull:
    "inline-flex items-center justify-center bg-surface text-fg-secondary border border-border-default font-medium px-4 py-2.5 rounded-md transition-all duration-200 ease-in-out enabled:hover:scale-[1.02] enabled:hover:bg-surface-hover enabled:hover:shadow-sm enabled:hover:border-border-strong focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand disabled:opacity-50 disabled:cursor-not-allowed",
} as const;

export const WG_CARD = {
  base: "rounded-lg border border-border-default bg-surface p-5 shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md",
  title: "text-lg font-semibold leading-heading tracking-heading text-fg-primary",
  description: "text-sm text-fg-tertiary",
} as const;

export const WG_FORM = {
  field:
    "w-full rounded-md border border-border-default bg-surface px-4 py-2.5 font-sans text-sm font-normal tracking-body transition-all duration-200 ease-in-out placeholder:text-fg-tertiary focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand-100 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface-active disabled:opacity-50",
  label: "text-sm font-medium text-fg-secondary",
} as const;

export const WG_NAV = {
  shell: "bg-surface border-r border-border-default",
  item: "flex items-center gap-3 rounded-md border-l-4 border-transparent px-4 py-2.5 text-sm font-medium text-fg-secondary transition-all duration-200 ease-in-out hover:bg-surface-hover",
  itemActive: "border-l-brand bg-brand-50 text-brand hover:bg-brand-100",
  icon: "size-5 shrink-0",
} as const;

/** Neutral platform/source chips — no random brand colors in UI. */
export const WG_PLATFORM_CHIP_CLASS =
  "bg-surface-active text-fg-secondary ring-1 ring-border-default/80 dark:bg-slate-800/50 dark:text-slate-200 dark:ring-slate-600/40";
