"use client";

import { useEffect } from "react";
import { onNavFeedback } from "@/lib/nav-feedback-events";
import { onProfileSaved } from "@/lib/profile-save-events";
import { useNavUiStore } from "@/stores/nav-ui-store";

/** Wires job-save, apply, and profile-save events to calm sidebar success states. */
export function useNavFeedbackListener() {
  const triggerSuccess = useNavUiStore((s) => s.triggerSuccess);

  useEffect(() => {
    const unsubFeedback = onNavFeedback((route, kind) => {
      triggerSuccess(route, kind);
    });
    const unsubProfile = onProfileSaved(() => {
      triggerSuccess("profile", "check");
    });
    return () => {
      unsubFeedback();
      unsubProfile();
    };
  }, [triggerSuccess]);
}
