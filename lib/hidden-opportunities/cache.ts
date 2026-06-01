import type { HiddenOpportunity } from "./types";

const CACHE_TTL_MS = 30 * 60 * 1000;
/** Bump when provider logic changes so stale merged feeds are not reused. */
const CACHE_SCHEMA_VERSION = 2;

type CacheEntry = {
  version: number;
  opportunities: HiddenOpportunity[];
  cachedAt: number;
  providerErrors: Partial<Record<string, string>>;
};

let memoryCache: CacheEntry | null = null;

export function getCacheTtlMs(): number {
  const raw = process.env.HIDDEN_JOBS_CACHE_TTL_MS;
  if (!raw) return CACHE_TTL_MS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : CACHE_TTL_MS;
}

export function readHiddenJobsCache(): {
  opportunities: HiddenOpportunity[];
  cached: boolean;
  cachedAt: string | null;
  expiresAt: string | null;
  providerErrors: Partial<Record<string, string>>;
} | null {
  if (!memoryCache || memoryCache.version !== CACHE_SCHEMA_VERSION) {
    memoryCache = null;
    return null;
  }
  const ttl = getCacheTtlMs();
  if (Date.now() - memoryCache.cachedAt > ttl) {
    memoryCache = null;
    return null;
  }
  const cachedAt = new Date(memoryCache.cachedAt).toISOString();
  const expiresAt = new Date(memoryCache.cachedAt + ttl).toISOString();
  return {
    opportunities: memoryCache.opportunities,
    cached: true,
    cachedAt,
    expiresAt,
    providerErrors: memoryCache.providerErrors,
  };
}

export function writeHiddenJobsCache(
  opportunities: HiddenOpportunity[],
  providerErrors: Partial<Record<string, string>>,
): void {
  memoryCache = {
    version: CACHE_SCHEMA_VERSION,
    opportunities,
    cachedAt: Date.now(),
    providerErrors,
  };
}

/** Test helper */
export function clearHiddenJobsCache(): void {
  memoryCache = null;
}
