"use client";

import { useEffect, useMemo, useState } from "react";
import type { DashboardRouteId } from "@/lib/dashboard-routes";

const STORAGE_KEY = "wg-saved-jobs-last-seen-count";

function readLastSeenCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeLastSeenCount(count: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(count));
  } catch {
    /* ignore */
  }
}

/**
 * Calm informational badge for Saved Jobs — surfaces unseen match momentum
 * without red “alert” styling.
 */
export function useSavedJobsBadge(
  matchCount: number,
  activeRoute: DashboardRouteId,
): string | null {
  const [lastSeen, setLastSeen] = useState(0);

  useEffect(() => {
    setLastSeen(readLastSeenCount());
  }, []);

  const unseen = Math.max(0, matchCount - lastSeen);

  useEffect(() => {
    if (activeRoute === "hidden-jobs" && matchCount > 0) {
      writeLastSeenCount(matchCount);
      setLastSeen(matchCount);
    }
  }, [activeRoute, matchCount]);

  return useMemo(() => {
    if (unseen <= 0 || activeRoute === "hidden-jobs") return null;
    return unseen === 1 ? "1 new" : `${unseen} new`;
  }, [activeRoute, unseen]);
}
