/**
 * Responsive layout utilities for the WorkGraph dashboard shell.
 * Import alongside `dashboard-layout.css`.
 *
 * Breakpoints:
 * - Mobile  <768px   — sidebar is a left drawer
 * - Tablet  768–1024 — sidebar collapsed (icons only)
 * - Desktop >1024px  — full sidebar
 */
export const DASHBOARD_LAYOUT = {
  topNavHeight: "56px",
  sidebarWidth: "240px",
  sidebarCollapsedWidth: "64px",
  contentMaxWidth: "1280px",
  mobileMax: "767px",
  tabletMin: "768px",
  tabletMax: "1024px",
  desktopMin: "1025px",
} as const;

export const DASHBOARD_MQ = {
  mobile: "(max-width: 767px)",
  tablet: "(min-width: 768px) and (max-width: 1024px)",
  desktop: "(min-width: 1025px)",
  mdUp: "(min-width: 768px)",
} as const;

/** Tailwind class bundles for consistent dashboard spacing. */
export const dashClasses = {
  page: "wg-dash-root min-h-dvh",
  content: "wg-dash-content mx-auto w-full max-w-[1200px]",
  pageStack: "space-y-8",
  section: "mb-8",
  sectionStack: "space-y-4",
  sectionCard: "wg-dash-section-card rounded-xl border bg-card p-6",
  grid: "grid gap-4",
  componentGap: "gap-4",
  touchTarget: "wg-touch-target",
  fadeIn: "animate-in fade-in duration-300",
  mobileBottomPad: "pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-8",
} as const;
