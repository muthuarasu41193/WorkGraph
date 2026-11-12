import { Fraunces, Inter } from "next/font/google";

/**
 * Landing-only fonts. Apply `landingFontVariables` (and optionally
 * `landingSans.className`) on the `.wg-landing` wrapper — nowhere else.
 */
export const landingDisplay = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-landing-display",
  display: "swap",
});

export const landingSans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-landing-sans",
  display: "swap",
});

/** CSS variable class names to put on the `.wg-landing` wrapper. */
export const landingFontVariables = `${landingDisplay.variable} ${landingSans.variable}`;

export const landingFontClassNames = {
  display: landingDisplay.className,
  sans: landingSans.className,
  variables: landingFontVariables,
} as const;
