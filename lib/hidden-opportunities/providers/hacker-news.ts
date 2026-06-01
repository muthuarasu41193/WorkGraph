import { fetchJson } from "../http";
import { scoreOpportunity } from "../ranking";
import type { HiddenOpportunity } from "../types";

type HnItem = {
  id?: number;
  title?: string;
  url?: string;
  time?: number;
  type?: string;
  deleted?: boolean;
  dead?: boolean;
};

const HIRING_PATTERNS = [
  /^ask hn:\s*who is hiring/i,
  /^ask hn:\s*who wants to be hired/i,
  /who is hiring\??$/i,
  /who wants to be hired\??$/i,
];

function matchesHiringThread(title: string): boolean {
  return HIRING_PATTERNS.some((re) => re.test(title.trim()));
}

function itemUrl(item: HnItem): string {
  if (item.url?.trim()) return item.url.trim();
  return `https://news.ycombinator.com/item?id=${item.id}`;
}

function toIso(unixSeconds?: number): string {
  if (!unixSeconds) return new Date().toISOString();
  return new Date(unixSeconds * 1000).toISOString();
}

async function fetchItem(id: number): Promise<HnItem | null> {
  try {
    return await fetchJson<HnItem>(
      `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
      { timeoutMs: 8_000 },
    );
  } catch {
    return null;
  }
}

/**
 * Official Firebase HN API — scans recent Ask HN stories for monthly hiring threads.
 */
export async function fetchHackerNewsOpportunities(): Promise<HiddenOpportunity[]> {
  const askIds = await fetchJson<number[]>(
    "https://hacker-news.firebaseio.com/v0/askstories.json",
  );
  const scanLimit = Math.min(
    Math.max(Number.parseInt(process.env.HIDDEN_HN_SCAN_LIMIT || "120", 10) || 120, 20),
    500,
  );

  const slice = askIds.slice(0, scanLimit);
  const items = await Promise.all(slice.map((id) => fetchItem(id)));

  const opportunities: HiddenOpportunity[] = [];

  for (const item of items) {
    if (!item?.id || item.deleted || item.dead || !item.title) continue;
    if (!matchesHiringThread(item.title)) continue;

    const hiringType = /wants to be hired/i.test(item.title) ? "candidate" : "employer";

    opportunities.push(
      scoreOpportunity({
        id: `hackernews:${item.id}`,
        source: "hackernews",
        title: item.title.trim(),
        url: itemUrl(item),
        company: "Hacker News",
        location: "Internet",
        author: undefined,
        postedAt: toIso(item.time),
        category: hiringType,
        tags: ["hackernews", hiringType === "candidate" ? "for-hire" : "hiring"],
      }),
    );
  }

  return opportunities;
}
