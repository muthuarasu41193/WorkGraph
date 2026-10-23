import type { Config } from "tailwindcss";

/**
 * Tailwind color map for Ledger.
 * Values live in app/tokens.css. This file exposes semantic names only.
 * Tailwind v4 also applies app/globals.css `@theme`, which clears the default palette.
 */
const token = (name: string) => `var(--${name})`;

const semanticColors = {
  transparent: "transparent",
  current: "currentcolor",
  inherit: "inherit",
  surface: token("surface"),
  "surface-raised": token("surface-raised"),
  "surface-sunken": token("surface-sunken"),
  ink: token("ink"),
  "ink-muted": token("ink-muted"),
  "ink-subtle": token("ink-subtle"),
  hairline: token("hairline"),
  accent: token("accent"),
  "accent-ink": token("accent-ink"),
  positive: token("positive"),
  caution: token("caution"),
  danger: token("danger"),
  "accent-wash": token("accent-wash"),
  "positive-wash": token("positive-wash"),
  "caution-wash": token("caution-wash"),
  "danger-wash": token("danger-wash"),
  "ink-wash": token("ink-wash"),
  scrim: token("scrim"),
  background: token("surface"),
  foreground: token("ink"),
  "foreground-secondary": token("ink-muted"),
  "foreground-muted": token("ink-subtle"),
  card: {
    DEFAULT: token("surface-raised"),
    foreground: token("ink"),
  },
  popover: {
    DEFAULT: token("surface-raised"),
    foreground: token("ink"),
  },
  primary: {
    DEFAULT: token("accent"),
    foreground: token("accent-ink"),
  },
  secondary: {
    DEFAULT: token("surface-sunken"),
    foreground: token("ink"),
  },
  muted: {
    DEFAULT: token("surface-sunken"),
    foreground: token("ink-muted"),
  },
  destructive: token("danger"),
  border: token("hairline"),
  input: token("hairline"),
  ring: token("accent"),
  brand: {
    DEFAULT: token("accent"),
    foreground: token("accent-ink"),
    50: token("accent-wash"),
    100: token("accent-wash"),
    200: token("accent-wash"),
    300: token("accent"),
    400: token("accent"),
    500: token("accent"),
    600: token("accent"),
    700: token("accent"),
    800: token("accent"),
    900: token("accent"),
    950: token("accent"),
  },
  fg: {
    primary: token("ink"),
    secondary: token("ink-muted"),
    tertiary: token("ink-subtle"),
  },
  success: {
    DEFAULT: token("positive"),
    50: token("positive-wash"),
    100: token("positive-wash"),
    foreground: token("positive"),
  },
  warning: {
    DEFAULT: token("caution"),
    50: token("caution-wash"),
    100: token("caution-wash"),
    foreground: token("caution"),
  },
  info: {
    DEFAULT: token("accent"),
    50: token("accent-wash"),
    100: token("accent-wash"),
    foreground: token("accent"),
  },
} as const;

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: semanticColors,
    extend: {
      spacing: {
        "space-1": token("space-1"),
        "space-2": token("space-2"),
        "space-3": token("space-3"),
        "space-4": token("space-4"),
        "space-5": token("space-5"),
        "space-6": token("space-6"),
        "space-7": token("space-7"),
        "space-8": token("space-8"),
        "space-9": token("space-9"),
        "space-10": token("space-10"),
      },
      borderRadius: {
        control: token("radius-control"),
        card: token("radius-card"),
        overlay: token("radius-overlay"),
        sm: token("radius-control"),
        md: token("radius-control"),
        lg: token("radius-card"),
        xl: token("radius-card"),
        "2xl": token("radius-overlay"),
        "3xl": token("radius-overlay"),
        "4xl": token("radius-overlay"),
      },
      borderWidth: {
        hairline: token("border-hairline"),
        strong: token("border-strong"),
      },
      boxShadow: {
        flat: token("shadow-flat"),
        raised: token("shadow-raised"),
        overlay: token("shadow-overlay"),
        xs: token("shadow-flat"),
        sm: token("shadow-flat"),
        DEFAULT: token("shadow-raised"),
        md: token("shadow-raised"),
        lg: token("shadow-overlay"),
        xl: token("shadow-overlay"),
        brand: token("shadow-flat"),
      },
      zIndex: {
        base: "var(--z-base)",
        sticky: "var(--z-sticky)",
        nav: "var(--z-nav)",
        overlay: "var(--z-overlay)",
        modal: "var(--z-modal)",
        toast: "var(--z-toast)",
        tooltip: "var(--z-tooltip)",
      },
      transitionDuration: {
        fast: token("duration-fast"),
        base: token("duration-base"),
        slow: token("duration-slow"),
      },
      transitionTimingFunction: {
        standard: token("ease-standard"),
        exit: token("ease-exit"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-display)", "var(--font-sans)", "ui-serif", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        numeric: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
