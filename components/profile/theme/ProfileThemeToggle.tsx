"use client";

import { Moon, Sun } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "@/lib/focus-ring";

export default function ProfileThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={resolved === "light" ? "Switch to dark mode" : "Switch to light mode"}
      aria-pressed={resolved === "dark"}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-surface-raised text-ink-muted transition-colors duration-base ease-exit hover:bg-surface-sunken    ",
        FOCUS_RING,
        className,
      )}
    >
      {resolved === "light" ? <Moon className={iconClass()} /> : <Sun className={iconClass()} />}
    </button>
  );
}
