"use client";

import { Moon, Sun } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { useProfileTheme } from "./ProfileThemeProvider";

export default function ProfileThemeToggle() {
  const { theme, toggle } = useProfileTheme();

  return (
    <IconButton
      type="button"
      variant="secondary"
      iconSize="md"
      onClick={toggle}
      label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      icon={theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    />
  );
}
