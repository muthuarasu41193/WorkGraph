/**
 * Responsive layout utilities for the WorkGraph dashboard shell.
 * Import alongside `dashboard-layout.css`.
 */
export const DASHBOARD_LAYOUT = {
  topNavHeight: "60px",
  sidebarWidth: "240px",
  sidebarCollapsedWidth: "72px",
  contentMaxWidth: "1200px",
  mobileBreakpoint: "768px",
} as const;

/** Tailwind class bundles for consistent dashboard spacing. */
export const dashClasses = {
  page: "wg-dash-root min-h-dvh",
  content: "wg-dash-content mx-auto w-full max-w-[1200px]",
  sectionCard: "wg-dash-section-card rounded-lg border bg-card",
  touchTarget: "min-h-11 min-w-11",
  fadeIn: "animate-in fade-in duration-300",
  mobileBottomPad: "pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-6",
} as const;
