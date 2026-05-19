"use client";

import { Moon, Sun } from "lucide-react";
import { useProfileTheme } from "./ProfileThemeProvider";

export default function ProfileThemeToggle() {
  const { theme, toggle } = useProfileTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--wg-color-border)] bg-[var(--wg-color-surface)] text-[var(--wg-color-text-secondary)] transition hover:bg-[var(--wg-color-surface-variant)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wg-color-primary)]"
    >
      {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
