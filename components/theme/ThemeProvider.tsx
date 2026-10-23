"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemeChoice = "light" | "dark" | "system";
export type Theme = ThemeChoice;

const STORAGE_KEY = "wg-theme";
const LEGACY_STORAGE_KEY = "wg-profile-theme";

const ThemeContext = createContext<{
  theme: ThemeChoice;
  resolved: "light" | "dark";
  toggle: () => void;
  setTheme: (choice: ThemeChoice) => void;
} | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

function readStoredTheme(): ThemeChoice | null {
  const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
  if (stored === "dark" || stored === "light" || stored === "system") return stored;
  return null;
}

function systemIsDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolvedTheme(choice: ThemeChoice): "light" | "dark" {
  if (choice === "light") return "light";
  if (choice === "dark") return "dark";
  return systemIsDark() ? "dark" : "light";
}

export function applyTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  const resolved = resolvedTheme(choice);
  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  return resolved;
}

export function persistTheme(choice: ThemeChoice) {
  localStorage.setItem(STORAGE_KEY, choice);
  localStorage.setItem(LEGACY_STORAGE_KEY, choice);
  return applyTheme(choice);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const choice = readStoredTheme() ?? "system";
    setThemeState(choice);
    setResolved(applyTheme(choice));

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const stored = readStoredTheme() ?? "system";
      if (stored !== "system") return;
      setResolved(applyTheme("system"));
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next: ThemeChoice) => {
    setThemeState(next);
    setResolved(persistTheme(next));
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const current = resolvedTheme(prev);
      const next: ThemeChoice = current === "dark" ? "light" : "dark";
      setResolved(persistTheme(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, resolved, toggle, setTheme }),
    [theme, resolved, toggle, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
