/**
 * Responsive layout utilities for the WorkGraph dashboard shell.
 * Import alongside `dashboard-layout.css`.
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
  touchTarget: "min-h-11 min-w-11",
  fadeIn: "animate-in fade-in duration-300",
  mobileBottomPad: "pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-8",
} as const;
