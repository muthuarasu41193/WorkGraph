"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "wg-nav-visited-routes";

function readVisited(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function persistVisited(visited: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...visited]));
  } catch {
    /* ignore */
  }
}

export function useNavVisitTracking() {
  const [visited, setVisited] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setVisited(readVisited());
  }, []);

  const markVisited = useCallback((routeId: string) => {
    setVisited((prev) => {
      if (prev.has(routeId)) return prev;
      const next = new Set(prev);
      next.add(routeId);
      persistVisited(next);
      return next;
    });
  }, []);

  const isVisited = useCallback((routeId: string) => visited.has(routeId), [visited]);

  return { markVisited, isVisited };
}
