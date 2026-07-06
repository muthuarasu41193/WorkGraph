/**
 * WorkGraph Design Tokens
 * @see DESIGN_SYSTEM.md
 * @see app/tokens.css — CSS source of truth
 */

export { colors, colorVars, semanticColors } from "./colors";
export { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, paragraphSpacing, typography } from "./typography";
export { space, spacePx, SPACING_SCALE_PX, snapSpacingPx } from "./spacing";
export { shell, container, breakpoints, iconSize, shellClasses } from "./layout";
export { radius, shadow, opacity, duration, transition, focusRing, focusRingClass } from "./effects";
export { motionDuration, motionEase, motionDistance, motionStagger, motionTransition } from "./motion";
export { platformBrandColors } from "./brands";
export {
  platformChipClass,
  sectionCardClass,
  profileCardClass,
  navActiveClass,
  statusBadge,
  matchScoreClass,
  filterChipClass,
  stickyBarClass,
  inputFieldClass,
} from "./classes";

/** Flat chart / data-viz color strings (CSS var references) */
export const chartColors = {
  accent: "var(--accent)",
  danger: "var(--danger)",
  success: "var(--success)",
  warning: "var(--warning)",
  info: "var(--info)",
  border: "var(--border-default)",
  textSecondary: "var(--text-secondary)",
  series: ["var(--accent)", "var(--danger)", "var(--accent)", "var(--danger-subtle)"] as const,
} as const;
