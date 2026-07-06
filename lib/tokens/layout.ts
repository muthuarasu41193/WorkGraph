/** Layout & shell tokens — mirrors app/tokens.css */

export const shell = {
  headerHeight: "var(--header-height)",
  sidebarWidth: "var(--sidebar-width)",
  sidebarWidthCollapsed: "var(--sidebar-width-collapsed)",
  mobileNavHeight: "var(--mobile-nav-height)",
  sheetWidth: "var(--shell-sheet-width)",
} as const;

export const container = {
  content: "var(--container-content)",
  wide: "var(--container-wide)",
  narrow: "var(--container-narrow)",
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
} as const;

export const iconSize = {
  xs: "var(--icon-xs)",
  sm: "var(--icon-sm)",
  md: "var(--icon-md)",
  lg: "var(--icon-lg)",
  xl: "var(--icon-xl)",
} as const;

/** Tailwind class bundles for shell layout */
export const shellClasses = {
  page: "wg-dash-root min-h-dvh",
  content: "wg-dash-content mx-auto w-full max-w-[var(--container-wide)]",
  sectionCard: "wg-section-card rounded-lg border border-border bg-surface-primary",
  touchTarget: "min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)]",
  fadeIn: "animate-in fade-in duration-300",
  mobileBottomPad: "pb-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom))] md:pb-6",
  header: "h-[var(--header-height)]",
  sidebar: "w-[var(--sidebar-width)]",
  sidebarCollapsed: "w-[var(--sidebar-width-collapsed)]",
  pagePadding: "px-[var(--page-padding-x)] py-[var(--page-padding-y)]",
} as const;
