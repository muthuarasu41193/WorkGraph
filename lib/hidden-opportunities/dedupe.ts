import type { HiddenOpportunity } from "./types";

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleTokens(title: string): Set<string> {
  return new Set(
    normalizeTitle(title)
      .split(" ")
      .filter((w) => w.length > 2),
  );
}

/** Jaccard similarity on title tokens (0–1). */
export function titleSimilarity(a: string, b: string): number {
  const ta = titleTokens(a);
  const tb = titleTokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersection = 0;
  for (const token of ta) {
    if (tb.has(token)) intersection += 1;
  }
  const union = ta.size + tb.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const TITLE_SIMILARITY_THRESHOLD = 0.82;

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    u.hash = "";
    u.search = "";
    return u.href.replace(/\/$/, "").toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

function normalizeCompany(company?: string): string {
  return (company ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Remove duplicates: same URL, same company+very similar title, or high title similarity.
 */
export function dedupeOpportunities(opportunities: HiddenOpportunity[]): HiddenOpportunity[] {
  const sorted = [...opportunities].sort((a, b) => b.score - a.score);
  const kept: HiddenOpportunity[] = [];

  for (const candidate of sorted) {
    const urlKey = normalizeUrl(candidate.url);
    const companyKey = normalizeCompany(candidate.company);

    const isDuplicate = kept.some((existing) => {
      if (normalizeUrl(existing.url) === urlKey) return true;

      const sameCompany =
        companyKey.length > 0 &&
        normalizeCompany(existing.company) === companyKey &&
        titleSimilarity(existing.title, candidate.title) >= TITLE_SIMILARITY_THRESHOLD;

      if (sameCompany) return true;

      return titleSimilarity(existing.title, candidate.title) >= TITLE_SIMILARITY_THRESHOLD;
    });

    if (!isDuplicate) kept.push(candidate);
  }

  return kept;
}
