/** Radius, shadow, transition, opacity, focus — mirrors app/tokens.css */

export const radius = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  full: "var(--radius-full)",
} as const;

export const shadow = {
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
  topnav: "var(--shadow-topnav)",
} as const;

export const opacity = {
  disabled: "var(--opacity-disabled)",
  muted: "var(--opacity-muted)",
  overlay: "var(--opacity-overlay)",
  backdrop: "var(--opacity-backdrop)",
} as const;

export const duration = {
  instant: "var(--duration-instant)",
  fast: "var(--duration-fast)",
  normal: "var(--duration-normal)",
  slow: "var(--duration-slow)",
  slower: "var(--duration-slower)",
} as const;

export const transition = {
  colors: "var(--transition-colors)",
  shadow: "var(--transition-shadow)",
  transform: "var(--transition-transform)",
  opacity: "var(--transition-opacity)",
} as const;

export const focusRing = {
  color: "var(--focus-ring-color)",
  width: "var(--focus-ring-width)",
  offset: "var(--focus-ring-offset)",
  ring: "var(--focus-ring)",
} as const;

/** Tailwind focus ring utility */
export const focusRingClass =
  "outline-none focus-visible:ring-[length:var(--focus-ring-width)] focus-visible:ring-[var(--focus-ring-color)]/50 focus-visible:ring-offset-[length:var(--focus-ring-offset)]";
