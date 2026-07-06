/** Typography tokens — mirrors app/tokens.css */

export const fontFamily = {
  sans: "var(--font-family-sans)",
  mono: "var(--font-family-mono)",
} as const;

export const fontSize = {
  label: "var(--font-size-label)",
  caption: "var(--font-size-caption)",
  body: "var(--font-size-body)",
  title: "var(--font-size-title)",
  heading: "var(--font-size-heading)",
  headingLg: "var(--font-size-heading-lg)",
  display: "var(--font-size-display)",
  displayLg: "var(--font-size-display-lg)",
} as const;

export const fontWeight = {
  normal: "var(--font-weight-normal)",
  medium: "var(--font-weight-medium)",
  semibold: "var(--font-weight-semibold)",
  bold: "var(--font-weight-bold)",
} as const;

export const lineHeight = {
  tight: "var(--line-height-tight)",
  snug: "var(--line-height-snug)",
  normal: "var(--line-height-normal)",
  relaxed: "var(--line-height-relaxed)",
} as const;

/** Tailwind class bundles for the type scale */
export const typography = {
  display: "text-[length:var(--font-size-display)] sm:text-[length:var(--font-size-display-lg)] font-semibold tracking-tight leading-[var(--line-height-tight)]",
  headingLg: "text-[length:var(--font-size-heading-lg)] font-semibold tracking-tight leading-[var(--line-height-tight)] text-foreground",
  heading: "text-[length:var(--font-size-heading)] font-semibold tracking-tight leading-[var(--line-height-snug)] text-foreground",
  title: "text-[length:var(--font-size-title)] font-semibold leading-[var(--line-height-normal)] text-foreground",
  body: "text-[length:var(--font-size-body)] font-normal leading-[var(--line-height-relaxed)] text-foreground",
  bodyMedium: "text-[length:var(--font-size-body)] font-medium leading-[var(--line-height-relaxed)] text-foreground",
  caption: "text-[length:var(--font-size-caption)] font-medium leading-[var(--line-height-normal)] text-muted-foreground",
  label: "font-mono text-[length:var(--font-size-label)] font-medium uppercase tracking-[var(--letter-spacing-wider)] text-muted-foreground",
} as const;
