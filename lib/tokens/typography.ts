/** Typography tokens — mirrors app/tokens.css */

export const fontFamily = {
  sans: "var(--font-family-sans)",
  mono: "var(--font-family-mono)",
} as const;

export const fontSize = {
  display: "var(--font-size-display)",
  headingXl: "var(--font-size-heading-xl)",
  headingL: "var(--font-size-heading-l)",
  headingM: "var(--font-size-heading-m)",
  headingS: "var(--font-size-heading-s)",
  title: "var(--font-size-title)",
  bodyLg: "var(--font-size-body-lg)",
  body: "var(--font-size-body)",
  small: "var(--font-size-small)",
  caption: "var(--font-size-caption)",
  code: "var(--font-size-code)",
} as const;

export const fontWeight = {
  normal: "var(--font-weight-normal)",
  medium: "var(--font-weight-medium)",
  semibold: "var(--font-weight-semibold)",
  bold: "var(--font-weight-bold)",
} as const;

export const lineHeight = {
  display: "var(--line-height-display)",
  headingXl: "var(--line-height-heading-xl)",
  headingL: "var(--line-height-heading-l)",
  headingM: "var(--line-height-heading-m)",
  headingS: "var(--line-height-heading-s)",
  title: "var(--line-height-title)",
  bodyLg: "var(--line-height-body-lg)",
  body: "var(--line-height-body)",
  small: "var(--line-height-small)",
  caption: "var(--line-height-caption)",
  code: "var(--line-height-code)",
} as const;

export const letterSpacing = {
  display: "var(--letter-spacing-display)",
  headingXl: "var(--letter-spacing-heading-xl)",
  headingL: "var(--letter-spacing-heading-l)",
  headingM: "var(--letter-spacing-heading-m)",
  headingS: "var(--letter-spacing-heading-s)",
  title: "var(--letter-spacing-title)",
  bodyLg: "var(--letter-spacing-body-lg)",
  body: "var(--letter-spacing-body)",
  small: "var(--letter-spacing-small)",
  caption: "var(--letter-spacing-caption)",
  code: "var(--letter-spacing-code)",
  label: "var(--letter-spacing-label)",
} as const;

export const paragraphSpacing = {
  bodyLg: "var(--paragraph-spacing-body-lg)",
  body: "var(--paragraph-spacing-body)",
  small: "var(--paragraph-spacing-small)",
} as const;

/** Tailwind class bundles for the type scale */
export const typography = {
  display: "text-display text-foreground",
  headingXl: "text-heading-xl text-foreground",
  headingL: "text-heading-l text-foreground",
  headingM: "text-heading-m text-foreground",
  headingS: "text-heading-s text-foreground",
  title: "text-title text-foreground",
  bodyLg: "text-body-lg text-foreground",
  body: "text-body text-foreground",
  bodyMedium: "text-body-medium text-foreground",
  bodyLgMedium: "text-body-lg-medium text-foreground",
  titleSemibold: "text-title-semibold text-foreground",
  small: "text-small text-foreground",
  caption: "text-caption text-muted-foreground",
  code: "text-code text-foreground",
  labelMono: "wg-label-mono",
} as const;

/** @deprecated Use headingM */
export const legacyFontSize = {
  label: "var(--font-size-label)",
  heading: "var(--font-size-heading)",
  headingLg: "var(--font-size-heading-lg)",
  displayLg: "var(--font-size-display-lg)",
} as const;
