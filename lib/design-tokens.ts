/** Signal Stamp color mirror for email, charts, and OG images. Keep in sync with app/tokens.css. */

export const WG_COLORS = {
  surface: "#F5F6F8",
  surfaceRaised: "#FFFFFF",
  surfaceSunken: "#E8EBF0",
  ink: "#111827",
  inkMuted: "#4B5563",
  inkSubtle: "#606978",
  hairline: "#E5E7EB",
  accent: "#A11F2B",
  accentInk: "#FFFFFF",
  positive: "#1B6B43",
  caution: "#8A5A10",
  danger: "#9B2C2C",
  accentWash: "#F8E8EA",
  positiveWash: "#E4F2EA",
  cautionWash: "#F8EED9",
  dangerWash: "#F8E6E3",
  highlight: "#C48A00",
  highlightInk: "#14181F",
  highlightWash: "#FFF6DC",
  scrim: "#14181F",
  brand: {
    50: "#F8E8EA",
    100: "#F8E8EA",
    200: "#F8E8EA",
    300: "#A11F2B",
    400: "#A11F2B",
    500: "#A11F2B",
    600: "#A11F2B",
    700: "#A11F2B",
    800: "#A11F2B",
    900: "#A11F2B",
    950: "#A11F2B",
  },
  primary: "#A11F2B",
  primaryHover: "#A11F2B",
  background: "#F5F6F8",
  backgroundSecondary: "#E8EBF0",
  surfaceHover: "#E8EBF0",
  surfaceActive: "#E8EBF0",
  border: "#E5E7EB",
  borderDefault: "#E5E7EB",
  borderStrong: "#E5E7EB",
  borderHover: "#6B7280",
  text: "#111827",
  textPrimary: "#111827",
  textSecondary: "#4B5563",
  textTertiary: "#606978",
  textMuted: "#606978",
  success: "#1B6B43",
  warning: "#8A5A10",
  info: "#A11F2B",
} as const;

export const WG_RADIUS = {
  sm: 6,
  md: 8,
  lg: 8,
  xl: 8,
  button: 6,
  tag: 6,
  input: 8,
  card: 8,
  full: 999,
} as const;

export const WG_SPACING = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 48,
  unit: 4,
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  buttonX: 16,
  buttonY: 8,
  card: 20,
} as const;

export const WG_LAYOUT = {
  page: "flex flex-col gap-[var(--layout-section-gap)]",
  pageMax: "max-w-[var(--layout-page-max)]",
  pagePad: "px-[var(--layout-page-pad-mobile)] md:px-[var(--layout-page-pad)]",
  section: "flex flex-col gap-[var(--layout-section-title-gap)]",
  sectionStack: "flex flex-col gap-[var(--layout-stack-group)]",
  stackTight: "flex flex-col gap-[var(--layout-stack-tight)]",
  componentGap: "gap-[var(--layout-card-gap)]",
  grid: "grid gap-[var(--layout-card-gap)]",
  card: "p-[var(--layout-card-pad-mobile)] md:p-[var(--layout-card-pad)]",
  flexRow: "flex gap-[var(--layout-card-gap)]",
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
    body: "20px",
    heading: "36px",
  },
  tracking: {
    body: "0em",
    heading: "-0.01em",
  },
  display: "text-role-display",
  h1: "text-role-title",
  h2: "text-role-subheading",
  cardTitle: "text-role-card-title",
  heading: "text-role-subheading",
  title: "text-role-card-title",
  body: "text-role-body",
  bodyLg: "text-role-body-lg",
  bodySm: "text-role-body",
  secondary: "text-role-body text-fg-secondary",
  caption: "text-role-caption text-fg-tertiary",
  button: "text-role-button",
  numeric: "font-numeric tabular-nums",
} as const;

export const WG_MOTION = {
  interactive: "transition-colors duration-base ease-standard",
  button: "transition-colors duration-fast ease-standard",
  card: "transition-colors duration-base ease-standard",
  link: "transition-colors duration-base ease-standard hover:underline underline-offset-4",
} as const;

export const WG_BUTTON = {
  primary: "bg-accent text-accent-ink font-medium px-4 py-2.5 rounded-control shadow-flat",
  secondary: "bg-surface-raised text-ink-muted border border-hairline font-medium px-4 py-2.5 rounded-control",
  hover: "transition-colors duration-base ease-standard enabled:hover:shadow-raised",
  focus: "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent",
  disabled: "disabled:opacity-50 disabled:cursor-not-allowed",
  primaryFull:
    "inline-flex items-center justify-center bg-accent text-accent-ink font-medium px-4 py-2.5 rounded-control shadow-flat transition-colors duration-base ease-standard enabled:hover:bg-accent enabled:hover:shadow-raised focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed",
  secondaryFull:
    "inline-flex items-center justify-center bg-surface-raised text-ink-muted border border-hairline font-medium px-4 py-2.5 rounded-control transition-colors duration-base ease-standard enabled:hover:bg-surface-sunken enabled:hover:shadow-raised focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed",
} as const;

export const WG_CARD = {
  base: "rounded-card border border-hairline bg-surface-raised p-5 shadow-flat transition-colors duration-base ease-standard hover:border-ink-subtle",
  title: "text-lg font-semibold leading-heading tracking-heading text-ink",
  description: "text-sm text-ink-subtle",
} as const;

export const WG_FORM = {
  field:
    "w-full rounded-control border border-hairline bg-surface-raised px-4 py-2.5 font-sans text-sm font-normal tracking-body transition-colors duration-base ease-standard placeholder:text-ink-subtle focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent-wash focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-50",
  label: "text-sm font-medium text-fg-secondary",
} as const;

export const WG_NAV = {
  shell: "bg-surface-raised border-r border-hairline",
  item: "flex items-center gap-3 rounded-control border-l-4 border-transparent px-4 py-2.5 text-sm font-medium text-ink-muted transition-colors duration-base ease-standard hover:bg-surface-sunken",
  itemActive: "border-l-accent bg-accent-wash text-accent hover:bg-accent-wash",
  icon: "size-5 shrink-0",
} as const;

/** Neutral platform/source chips — no random brand colors in UI. */
export const WG_PLATFORM_CHIP_CLASS =
  "bg-surface-sunken text-ink-muted ring-1 ring-hairline/80";
