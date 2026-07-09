export type NavFeedbackRoute = "applications" | "hidden-jobs" | "profile";

export type NavFeedbackKind = "glow" | "pulse" | "check";

const NAV_FEEDBACK_EVENT = "wg:nav-feedback";

export function emitNavFeedback(route: NavFeedbackRoute, kind: NavFeedbackKind) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NAV_FEEDBACK_EVENT, { detail: { route, kind } }));
}

export function onNavFeedback(
  listener: (route: NavFeedbackRoute, kind: NavFeedbackKind) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const custom = event as CustomEvent<{ route?: NavFeedbackRoute; kind?: NavFeedbackKind }>;
    const route = custom.detail?.route;
    const kind = custom.detail?.kind;
    if (route && kind) listener(route, kind);
  };
  window.addEventListener(NAV_FEEDBACK_EVENT, handler);
  return () => window.removeEventListener(NAV_FEEDBACK_EVENT, handler);
}
