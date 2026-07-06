/**
 * WorkGraph Motion System — TypeScript API
 * Linear-inspired: 150–200ms, ease-out, minimal, professional.
 * CSS source: app/motion.css
 */

import type { CSSProperties } from "react";

/** Stagger timing — max 5 items per DESIGN_SYSTEM.md */
export const STAGGER_STEP_MS = 30;
export const STAGGER_MAX_ITEMS = 5;

/** Delay in ms for staggered list enter animations */
export function staggerDelay(index: number): number {
  return Math.min(Math.max(index, 0), STAGGER_MAX_ITEMS) * STAGGER_STEP_MS;
}

/** Inline style for staggered animation delay */
export function staggerStyle(index: number): CSSProperties {
  return { animationDelay: `${staggerDelay(index)}ms` };
}

/** CSS custom property style for stagger */
export function staggerVar(index: number): CSSProperties {
  return { "--motion-delay": `${staggerDelay(index)}ms` } as CSSProperties;
}

/**
 * Shared Tailwind class bundles for overlay primitives.
 * Pair with Radix data-open / data-state attributes from tw-animate-css.
 */
export const motion = {
  /** Fade backdrop for dialogs, sheets */
  overlay:
    "wg-motion-overlay duration-[var(--duration-motion-short)] ease-out data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",

  /** Centered dialog content — subtle scale + fade */
  dialog:
    "wg-motion-dialog duration-[var(--duration-motion)] ease-[var(--ease-motion)] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.98] data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.98]",

  /** Dropdown / menu surfaces */
  dropdown:
    "wg-motion-dropdown duration-[var(--duration-motion-short)] ease-[var(--ease-motion)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.98]",

  /** Popover surfaces */
  popover:
    "wg-motion-popover duration-[var(--duration-motion-short)] ease-[var(--ease-motion)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.98]",

  /** Slide-in sheet panels */
  sheet:
    "duration-[var(--duration-motion-long)] ease-[var(--ease-motion)] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",

  /** Toast enter */
  toast:
    "wg-motion-page-crossfade animate-in slide-in-from-bottom-2 fade-in duration-[var(--duration-motion-long)] ease-out",

  /** Page / section enter */
  pageEnter: "wg-motion-page-enter",
  pageCrossfade: "wg-motion-page-crossfade",

  /** Interactive surfaces */
  hover: "wg-motion-hover",
  hoverLift: "wg-motion-hover wg-motion-hover-lift",
  card: "wg-motion-card",
  cardLift: "wg-motion-card wg-motion-card-lift",
  cardEnter: "wg-motion-card-enter",
  button: "wg-motion-button",

  /** Loading & placeholder */
  loading: "wg-motion-loading",
  skeleton: "wg-motion-skeleton",
  skeletonShimmer: "wg-motion-skeleton-shimmer",

  /** Sidebar chrome */
  sidebar: "wg-motion-sidebar",
  sidebarItem: "wg-motion-sidebar-item",

  /** Stagger utility class */
  stagger: "wg-motion-stagger",
} as const;

export type MotionClass = (typeof motion)[keyof typeof motion];
