/** Motion tokens — mirrors app/motion.css & app/tokens.css */

export const motionDuration = {
  short: "var(--duration-motion-short)",
  base: "var(--duration-motion)",
  long: "var(--duration-motion-long)",
} as const;

export const motionEase = {
  default: "var(--ease-motion)",
  out: "ease-out",
} as const;

export const motionDistance = {
  sm: "var(--motion-distance-sm)",
  base: "var(--motion-distance)",
  lg: "var(--motion-distance-lg)",
} as const;

export const motionStagger = {
  step: "var(--motion-stagger-step)",
  max: 5,
  stepMs: 30,
} as const;

export const motionTransition = {
  colors: "var(--transition-motion-colors)",
  shadow: "var(--transition-motion-shadow)",
  transform: "var(--transition-motion-transform)",
  opacity: "var(--transition-motion-opacity)",
  sidebar: "var(--transition-motion-sidebar)",
} as const;
