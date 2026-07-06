/** Spacing tokens — 8pt grid, mirrors app/tokens.css */

/** Allowed spacing values in pixels */
export const SPACING_SCALE_PX = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128] as const;

export const space = {
  1: "var(--space-1)",
  2: "var(--space-2)",
  3: "var(--space-3)",
  4: "var(--space-4)",
  5: "var(--space-5)",
  6: "var(--space-6)",
  8: "var(--space-8)",
  10: "var(--space-10)",
  12: "var(--space-12)",
  16: "var(--space-16)",
  20: "var(--space-20)",
  24: "var(--space-24)",
  32: "var(--space-32)",
} as const;

export const spacePx = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
} as const;

/** Snap an arbitrary pixel value to the nearest allowed spacing step */
export function snapSpacingPx(px: number): (typeof SPACING_SCALE_PX)[number] {
  return SPACING_SCALE_PX.reduce((best, step) =>
    Math.abs(step - px) < Math.abs(best - px) ? step : best,
  );
}
