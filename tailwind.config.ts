import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#C41E3A",
          dark: "#A01830",
          light: "#FF2D4A",
          foreground: "#FFFFFF",
        },
        background: "#F8F7F4",
        surface: {
          DEFAULT: "#FFFFFF",
          "2": "#F3F2EF",
        },
        foreground: {
          DEFAULT: "#0A0A0A",
          secondary: "#4A4A4A",
          muted: "#8A8A8A",
        },
        border: "#E5E5E5",
        success: "#16A34A",
        warning: "#D97706",
        accent: {
          blue: "#2563EB",
        },
        wg: {
          primary: "var(--wg-primary)",
          "primary-dark": "var(--wg-primary-dark)",
          "primary-light": "var(--wg-primary-light)",
          background: "var(--wg-bg)",
          surface: "var(--wg-surface)",
          "surface-2": "var(--wg-bg-secondary)",
          heading: "var(--wg-text-primary)",
          body: "var(--wg-text-secondary)",
          muted: "var(--wg-text-muted)",
          border: "var(--wg-border)",
          success: "var(--wg-success)",
          warning: "var(--wg-warning)",
          "accent-blue": "var(--wg-accent-blue)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "6": "24px",
        "8": "32px",
        "12": "48px",
        "16": "64px",
        "20": "80px",
        "24": "96px",
        "32": "128px",
      },
      maxWidth: {
        landing: "1200px",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        "pulse-soft": "pulse-soft 2.5s ease-in-out infinite",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(0.92)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
