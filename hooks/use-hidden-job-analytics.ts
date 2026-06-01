"use client";

import { useCallback, useRef } from "react";
import type { HiddenJobAnalyticsEvent } from "@/lib/hidden-opportunities/types";

export function useHiddenJobAnalytics() {
  const viewedRef = useRef<Set<string>>(new Set());

  const track = useCallback(async (payload: {
    opportunityId: string;
    event: HiddenJobAnalyticsEvent;
    source?: string;
  }) => {
    try {
      await fetch("/api/hidden-jobs/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId: payload.opportunityId,
          event: payload.event,
          source: payload.source,
        }),
      });
    } catch {
      /* non-blocking */
    }
  }, []);

  const trackView = useCallback(
    (opportunityId: string, source?: string) => {
      if (viewedRef.current.has(opportunityId)) return;
      viewedRef.current.add(opportunityId);
      void track({ opportunityId, event: "view", source });
    },
    [track],
  );

  const trackClick = useCallback(
    (opportunityId: string, source?: string) => {
      void track({ opportunityId, event: "click", source });
    },
    [track],
  );

  const trackSave = useCallback(
    (opportunityId: string, source?: string) => {
      void track({ opportunityId, event: "save", source });
    },
    [track],
  );

  return { trackView, trackClick, trackSave };
}
