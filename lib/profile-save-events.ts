const PROFILE_SAVE_EVENT = "profile:saved";
const PROFILE_SAVE_ALL_EVENT = "profile:save-all";
const PROFILE_SAVE_ALL_BEGIN_EVENT = "profile:save-all-begin";
const PROFILE_SAVE_START_EVENT = "profile:save-start";
const PROFILE_SAVE_ERROR_EVENT = "profile:save-error";

export function emitProfileSaved(section?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROFILE_SAVE_EVENT, { detail: { section: section || "profile" } }));
}

export function emitProfileSaveStart(section?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROFILE_SAVE_START_EVENT, { detail: { section: section || "profile" } }));
}

export function emitProfileSaveError(section?: string, message?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(PROFILE_SAVE_ERROR_EVENT, {
      detail: { section: section || "profile", message: message || "Failed to save changes." },
    })
  );
}

export function emitSaveAllRequested() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROFILE_SAVE_ALL_EVENT));
}

export function emitSaveAllBegin(sections: string[]) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROFILE_SAVE_ALL_BEGIN_EVENT, { detail: { sections } }));
}

export function onProfileSaved(listener: (section: string) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const custom = event as CustomEvent<{ section?: string }>;
    listener(custom.detail?.section || "profile");
  };
  window.addEventListener(PROFILE_SAVE_EVENT, handler);
  return () => window.removeEventListener(PROFILE_SAVE_EVENT, handler);
}

export function onSaveAllRequested(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(PROFILE_SAVE_ALL_EVENT, listener);
  return () => window.removeEventListener(PROFILE_SAVE_ALL_EVENT, listener);
}

export function onSaveAllBegin(listener: (sections: string[]) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const custom = event as CustomEvent<{ sections?: string[] }>;
    listener(Array.isArray(custom.detail?.sections) ? custom.detail.sections : []);
  };
  window.addEventListener(PROFILE_SAVE_ALL_BEGIN_EVENT, handler);
  return () => window.removeEventListener(PROFILE_SAVE_ALL_BEGIN_EVENT, handler);
}

export function onProfileSaveStart(listener: (section: string) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const custom = event as CustomEvent<{ section?: string }>;
    listener(custom.detail?.section || "profile");
  };
  window.addEventListener(PROFILE_SAVE_START_EVENT, handler);
  return () => window.removeEventListener(PROFILE_SAVE_START_EVENT, handler);
}

export function onProfileSaveError(listener: (section: string, message: string) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const custom = event as CustomEvent<{ section?: string; message?: string }>;
    listener(custom.detail?.section || "profile", custom.detail?.message || "Failed to save changes.");
  };
  window.addEventListener(PROFILE_SAVE_ERROR_EVENT, handler);
  return () => window.removeEventListener(PROFILE_SAVE_ERROR_EVENT, handler);
}
