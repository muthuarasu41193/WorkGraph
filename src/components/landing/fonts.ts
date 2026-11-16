import localFont from "next/font/local";

/**
 * Landing-only fonts (local woff2 — avoids next/font/google Turbopack issues).
 * Apply `landingFontVariables` on the `.wg-landing` wrapper.
 */
export const landingDisplay = localFont({
  src: [
    {
      path: "../../../public/landing/fonts/outfit-latin-600.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../../public/landing/fonts/outfit-latin-700.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../../public/landing/fonts/outfit-latin-800.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-landing-display",
  display: "swap",
});

export const landingSans = localFont({
  src: [
    {
      path: "../../../public/landing/fonts/manrope-latin-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/landing/fonts/manrope-latin-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../public/landing/fonts/manrope-latin-600.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../../public/landing/fonts/manrope-latin-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
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
