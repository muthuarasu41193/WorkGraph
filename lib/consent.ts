export const CONSENT_POLICY_VERSION = "1";
export const CONSENT_COOKIE_NAME = "wg_consent";
export const CONSENT_STORAGE_KEY = "wg_consent";
export const CONSENT_MAX_AGE_SEC = 180 * 24 * 60 * 60;
export const OPEN_CONSENT_EVENT = "wg:open-consent";
export const CONSENT_CHANGED_EVENT = "wg:consent-changed";

export type ConsentCategory = "strictlyNecessary" | "analytics" | "marketing";

export type ConsentCategories = {
  strictlyNecessary: true;
  analytics: boolean;
  marketing: boolean;
};

export type ConsentRecord = {
  version: string;
  timestamp: string;
  anonymousId: string;
  categories: ConsentCategories;
};

export type ConsentIO = {
  getLocal: () => string | null;
  setLocal: (value: string) => void;
  getCookie: () => string | null;
  setCookie: (value: string, maxAgeSec: number) => void;
};

export function acceptAllCategories(): ConsentCategories {
  return { strictlyNecessary: true, analytics: true, marketing: true };
}

export function rejectAllCategories(): ConsentCategories {
  return { strictlyNecessary: true, analytics: false, marketing: false };
}

export function createConsentRecord(
  categories: ConsentCategories,
  anonymousId?: string,
): ConsentRecord {
  return {
    version: CONSENT_POLICY_VERSION,
    timestamp: new Date().toISOString(),
    anonymousId: anonymousId?.trim() || createAnonymousId(),
    categories: { ...categories, strictlyNecessary: true },
  };
}

export function serializeConsentRecord(record: ConsentRecord): string {
  return JSON.stringify(record);
}

export function parseConsentRecord(raw: string | null | undefined): ConsentRecord | null {
  if (!raw || raw === "accepted" || raw === "declined") return null;
  try {
    const value = JSON.parse(raw) as Partial<ConsentRecord>;
    if (!value || typeof value !== "object") return null;
    if (typeof value.version !== "string" || value.version.length === 0) return null;
    if (typeof value.timestamp !== "string" || Number.isNaN(Date.parse(value.timestamp))) return null;
    if (typeof value.anonymousId !== "string" || value.anonymousId.length === 0) return null;
    const categories = value.categories;
    if (!categories || typeof categories !== "object") return null;
    if (typeof categories.analytics !== "boolean" || typeof categories.marketing !== "boolean") return null;
    return {
      version: value.version,
      timestamp: value.timestamp,
      anonymousId: value.anonymousId,
      categories: {
        strictlyNecessary: true,
        analytics: categories.analytics,
        marketing: categories.marketing,
      },
    };
  } catch {
    return null;
  }
}

export function needsReprompt(
  record: ConsentRecord | null,
  version = CONSENT_POLICY_VERSION,
): boolean {
  return !record || record.version !== version;
}

export function shouldLoadCategory(
  record: ConsentRecord | null,
  category: ConsentCategory,
): boolean {
  if (category === "strictlyNecessary") return true;
  if (!record || needsReprompt(record)) return false;
  return record.categories[category] === true;
}

export function defaultConsentIO(): ConsentIO {
  return {
    getLocal: () => {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(CONSENT_STORAGE_KEY);
    },
    setLocal: (value: string) => {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
    },
    getCookie: () => readBrowserCookie(CONSENT_COOKIE_NAME),
    setCookie: (value: string, maxAgeSec: number) => {
      if (typeof document === "undefined") return;
      const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax${secure}`;
    },
  };
}

export function readConsent(io: ConsentIO = defaultConsentIO()): ConsentRecord | null {
  try {
    const fromLocal = parseConsentRecord(io.getLocal());
    if (fromLocal) return fromLocal;
  } catch {
    // private mode / blocked storage
  }
  try {
    return parseConsentRecord(io.getCookie());
  } catch {
    return null;
  }
}

export function writeConsent(record: ConsentRecord, io: ConsentIO = defaultConsentIO()): void {
  const payload = serializeConsentRecord(record);
  try {
    io.setLocal(payload);
  } catch {
    // ignore quota / private mode
  }
  try {
    io.setCookie(payload, CONSENT_MAX_AGE_SEC);
  } catch {
    // ignore cookie write failures
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: record }));
  }
}

export function openConsentManager(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
}

export function reportConsentToServer(record: ConsentRecord): void {
  if (typeof window === "undefined") return;
  void fetch("/api/consent", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      anonymousId: record.anonymousId,
      policyVersion: record.version,
      timestamp: record.timestamp,
      categories: record.categories,
    }),
    keepalive: true,
  }).catch(() => {
    // audit log is best-effort; choice is already stored first-party
  });
}

function createAnonymousId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `anon-${Date.now().toString(36)}`;
}

function readBrowserCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";");
  for (const part of parts) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === name) {
      try {
        return decodeURIComponent(rest.join("="));
      } catch {
        return rest.join("=");
      }
    }
  }
  return null;
}
