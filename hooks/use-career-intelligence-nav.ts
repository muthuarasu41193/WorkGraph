"use client";

import { useCallback, useEffect, useState } from "react";
import type { DashboardRouteId } from "@/lib/dashboard-routes";

const STORAGE_KEY = "wg-career-intelligence-expanded";

const INTELLIGENCE_ROUTE_IDS = new Set<string>([
  "resume-intelligence",
  "applications",
  "workgraph-direct",
  "vault",
]);

export function isCareerIntelligenceRoute(routeId: string): boolean {
  return INTELLIGENCE_ROUTE_IDS.has(routeId) || routeId === "interview-vault";
}

export function getSuggestedIntelligenceRoute(
  profileCompleteness: number,
  appliedCount: number,
): DashboardRouteId | "interview-vault" | null {
  if (profileCompleteness < 80) return "resume-intelligence";
  if (appliedCount >= 5) return "applications";
  return null;
}

export function useCareerIntelligenceNav(activeRoute: string) {
  const [expanded, setExpanded] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setExpanded(stored === "true");
      } else if (isCareerIntelligenceRoute(activeRoute)) {
        setExpanded(true);
      }
    } catch {
      if (isCareerIntelligenceRoute(activeRoute)) setExpanded(true);
    }
    setHydrated(true);
  }, [activeRoute]);

  const toggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const expand = useCallback(() => {
    setExpanded(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (isCareerIntelligenceRoute(activeRoute)) {
      expand();
    }
  }, [activeRoute, expand]);

  return { expanded, hydrated, toggle, expand };
}
