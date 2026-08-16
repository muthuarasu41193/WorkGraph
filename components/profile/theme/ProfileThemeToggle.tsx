"use client";

import { Moon, Sun } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "@/lib/focus-ring";

export default function ProfileThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      aria-pressed={theme === "dark"}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors duration-150 ease-out hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
        FOCUS_RING,
        className,
      )}
    >
      {theme === "light" ? <Moon className={iconClass()} /> : <Sun className={iconClass()} />}
    </button>
  );
}
