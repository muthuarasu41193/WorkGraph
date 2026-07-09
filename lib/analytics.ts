type TrackPayload = Record<string, string | number | boolean | null | undefined>;

/** Lightweight client analytics — extend with your provider when ready. */
export function trackEvent(event: string, payload: TrackPayload = {}): void {
  if (typeof window === "undefined") return;

  const detail = { event, ...payload, at: new Date().toISOString() };

  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", detail);
  }

  window.dispatchEvent(new CustomEvent("wg:analytics", { detail }));
}
