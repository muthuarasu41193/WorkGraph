"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { DashboardRouteId } from "@/lib/dashboard-routes";
import { NAV_SHORTCUTS } from "@/lib/dashboard-nav-groups";

type Options = {
  onToggleCollapse?: () => void;
  navigate: (route: DashboardRouteId) => void;
  enabled?: boolean;
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function useSidebarShortcuts({ onToggleCollapse, navigate, enabled = true }: Options) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    let chordPending = false;
    let chordTimer: ReturnType<typeof setTimeout> | undefined;

    function clearChord() {
      chordPending = false;
      if (chordTimer) clearTimeout(chordTimer);
      chordTimer = undefined;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;

      if (e.key === "[" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onToggleCollapse?.();
        clearChord();
        return;
      }

      if (e.key === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        chordPending = true;
        if (chordTimer) clearTimeout(chordTimer);
        chordTimer = setTimeout(clearChord, 1000);
        return;
      }

      if (!chordPending || e.metaKey || e.ctrlKey || e.altKey) return;

      const shortcut = NAV_SHORTCUTS[e.key];
      if (!shortcut) {
        clearChord();
        return;
      }

      e.preventDefault();
      clearChord();

      if (shortcut.href) {
        router.push(shortcut.href);
        return;
      }

      navigate(shortcut.id as DashboardRouteId);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      clearChord();
    };
  }, [enabled, navigate, onToggleCollapse, router]);
}
