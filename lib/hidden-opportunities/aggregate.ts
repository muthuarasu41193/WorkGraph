import { readHiddenJobsCache, writeHiddenJobsCache } from "./cache";
import { dedupeOpportunities } from "./dedupe";
import { filterEmployerHiringOpportunities } from "./hiring-filter";
import { fetchGitHubOpportunities } from "./providers/github";
import { fetchHackerNewsOpportunities } from "./providers/hacker-news";
import { fetchRedditOpportunities } from "./providers/reddit";
import { sortOpportunities } from "./ranking";
import type { HiddenJobsQuery, HiddenJobsResponse, HiddenOpportunity, HiddenOpportunitySource } from "./types";
import { HIDDEN_OPPORTUNITY_SOURCES } from "./types";

type ProviderResult = {
  source: HiddenOpportunitySource;
  items: HiddenOpportunity[];
  error?: string;
};

const DISCOVERY_SOURCES = new Set<HiddenOpportunitySource>(HIDDEN_OPPORTUNITY_SOURCES);

function onlyDiscoverySources(items: HiddenOpportunity[]): HiddenOpportunity[] {
  return items.filter((o) => DISCOVERY_SOURCES.has(o.source));
}

async function runProvider(
  source: HiddenOpportunitySource,
  fn: () => Promise<HiddenOpportunity[]>,
): Promise<ProviderResult> {
  try {
    const items = await fn();
    return { source, items };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (err && typeof err === "object" && "partial" in err) {
      const partial = (err as { partial?: HiddenOpportunity[] }).partial ?? [];
      return { source, items: partial, error: message };
    }
    return { source, items: [], error: message };
  }
}

function countBySource(items: HiddenOpportunity[]): Partial<Record<HiddenOpportunitySource, number>> {
  const counts: Partial<Record<HiddenOpportunitySource, number>> = {};
  for (const item of items) {
    counts[item.source] = (counts[item.source] ?? 0) + 1;
  }
  return counts;
}

function applyClientFilters(
  items: HiddenOpportunity[],
  query: HiddenJobsQuery,
): HiddenOpportunity[] {
  let filtered = items;

  if (query.source) {
    filtered = filtered.filter((o) => o.source === query.source);
  }

  if (query.remote) {
    filtered = filtered.filter(
      (o) =>
        o.tags.includes("remote") ||
        /\bremote\b/i.test(`${o.title} ${o.location ?? ""} ${o.tags.join(" ")}`),
    );
  }

  if (query.country?.trim()) {
    const country = query.country.trim().toLowerCase();
    filtered = filtered.filter((o) =>
      `${o.title} ${o.location ?? ""} ${o.company ?? ""}`.toLowerCase().includes(country),
    );
  }

  if (query.postedWithinDays && query.postedWithinDays > 0) {
    const cutoff = Date.now() - query.postedWithinDays * 86_400_000;
    filtered = filtered.filter((o) => Date.parse(o.postedAt) >= cutoff);
  }

  if (query.q?.trim()) {
    const needle = query.q.trim().toLowerCase();
    filtered = filtered.filter((o) => {
      const hay = [o.title, o.company, o.author, o.location, ...o.tags].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(needle);
    });
  }

  return filtered;
}

export async function fetchAllHiddenOpportunities(
  query: HiddenJobsQuery = {},
): Promise<HiddenJobsResponse> {
  const cached = readHiddenJobsCache();
  let base: HiddenOpportunity[];
  let providerErrors: Partial<Record<HiddenOpportunitySource, string>> = {};
  let fromCache = false;
  let cachedAt: string | null = null;
  let expiresAt: string | null = null;

  if (cached) {
    base = filterEmployerHiringOpportunities(onlyDiscoverySources(cached.opportunities));
    providerErrors = cached.providerErrors as Partial<Record<HiddenOpportunitySource, string>>;
    fromCache = true;
    cachedAt = cached.cachedAt;
    expiresAt = cached.expiresAt;
  } else {
    const providers: Array<Promise<ProviderResult>> = [
      runProvider("reddit", fetchRedditOpportunities),
      runProvider("hackernews", fetchHackerNewsOpportunities),
      runProvider("github", fetchGitHubOpportunities),
    ];

    const results = await Promise.all(providers);

    const merged: HiddenOpportunity[] = [];
    for (const result of results) {
      if (result.error) providerErrors[result.source] = result.error;
      merged.push(...result.items);
    }

    base = filterEmployerHiringOpportunities(onlyDiscoverySources(dedupeOpportunities(merged)));
    writeHiddenJobsCache(base, providerErrors);
    const fresh = readHiddenJobsCache();
    cachedAt = fresh?.cachedAt ?? new Date().toISOString();
    expiresAt = fresh?.expiresAt ?? null;
  }

  const sort = query.sort === "newest" ? "newest" : "relevant";
  const sorted = sortOpportunities(base, sort);
  const filtered = applyClientFilters(sorted, query);
  const limit = query.limit ?? 200;

  return {
    ok: true,
    opportunities: filtered.slice(0, limit),
    meta: {
      total: base.length,
      filtered: filtered.length,
      cached: fromCache,
      cachedAt,
      expiresAt,
      sources: countBySource(base),
      ...(Object.keys(providerErrors).length > 0 ? { providerErrors } : {}),
    },
  };
}
