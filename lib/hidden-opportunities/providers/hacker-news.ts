import { fetchJson } from "../http";
import { scoreOpportunity } from "../ranking";
import type { HiddenOpportunity } from "../types";

type HnItem = {
  id?: number;
  title?: string;
  text?: string;
  url?: string;
  time?: number;
  type?: string;
  by?: string;
  kids?: number[];
  deleted?: boolean;
  dead?: boolean;
};

type AlgoliaHit = {
  objectID?: string;
  title?: string;
  story_title?: string;
  created_at?: string;
};

type AlgoliaResponse = {
  hits?: AlgoliaHit[];
};

const THREAD_QUERIES = [
  { query: "Ask HN: Who is hiring", category: "employer" as const },
  { query: "Ask HN: Who wants to be hired", category: "candidate" as const },
];

function isHiringMegathreadTitle(title: string, category: "employer" | "candidate"): boolean {
  const t = title.trim();
  if (category === "employer") {
    return /^ask hn:\s*who is hiring(\s+right now)?\??(\s*\([^)]+\))?\s*$/i.test(t);
  }
  return /^ask hn:\s*who wants to be hired\??(\s*\([^)]+\))?\s*$/i.test(t);
}

function toIso(unixSeconds?: number): string {
  if (!unixSeconds) return new Date().toISOString();
  return new Date(unixSeconds * 1000).toISOString();
}

function hnItemUrl(id: number, item: HnItem): string {
  if (item.url?.trim()) return item.url.trim();
  return `https://news.ycombinator.com/item?id=${id}`;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x2F;/gi, "/")
    .replace(/&#x2f;/g, "/")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

function commentTitle(text: string): string {
  const line = decodeHtmlEntities(text)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(/[.!?\n]/)[0]
    ?.trim();
  if (!line) return "Hacker News comment";
  return line.length > 140 ? `${line.slice(0, 137)}…` : line;
}

async function fetchItem(id: number): Promise<HnItem | null> {
  try {
    return await fetchJson<HnItem>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
      timeoutMs: 10_000,
    });
  } catch {
    return null;
  }
}

/** Public HN search API — resolves latest hiring megathread IDs (Firebase has no search). */
async function findHiringThreadIds(query: string, limit: number): Promise<number[]> {
  const params = new URLSearchParams({
    query,
    tags: "story",
    hitsPerPage: String(limit),
  });
  const payload = await fetchJson<AlgoliaResponse>(
    `https://hn.algolia.com/api/v1/search_by_date?${params.toString()}`,
    { timeoutMs: 12_000 },
  );

  const ids: number[] = [];
  for (const hit of payload.hits ?? []) {
    const id = Number.parseInt(String(hit.objectID ?? ""), 10);
    const title = String(hit.title || hit.story_title || "");
    if (!Number.isFinite(id) || !title) continue;
    ids.push(id);
  }
  return ids;
}

async function mapInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R | null>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const settled = await Promise.all(batch.map(fn));
    for (const value of settled) {
      if (value != null) results.push(value);
    }
  }
  return results;
}

function threadToOpportunity(
  thread: HnItem,
  category: "employer" | "candidate",
): HiddenOpportunity | null {
  if (!thread.id || !thread.title) return null;
  return scoreOpportunity({
    id: `hackernews:thread:${thread.id}`,
    source: "hackernews",
    title: thread.title.trim(),
    url: hnItemUrl(thread.id, thread),
    company: "Hacker News",
    location: "Internet",
    author: thread.by ? `@${thread.by}` : undefined,
    postedAt: toIso(thread.time),
    category,
    tags: ["hackernews", "thread", category === "candidate" ? "for-hire" : "hiring"],
  });
}

function commentToOpportunity(
  comment: HnItem,
  threadId: number,
  category: "employer" | "candidate",
): HiddenOpportunity | null {
  if (!comment.id || comment.deleted || comment.dead) return null;
  const body = String(comment.text || "").trim();
  if (body.length < 20) return null;

  return scoreOpportunity({
    id: `hackernews:${threadId}:${comment.id}`,
    source: "hackernews",
    title: commentTitle(body),
    url: `https://news.ycombinator.com/item?id=${comment.id}`,
    company: "Hacker News",
    location: category === "employer" ? "Who is hiring thread" : "Who wants to be hired thread",
    author: comment.by ? `@${comment.by}` : undefined,
    postedAt: toIso(comment.time),
    category,
    tags: ["hackernews", "comment", category === "candidate" ? "for-hire" : "hiring"],
  });
}

async function fetchThreadOpportunities(
  threadId: number,
  category: "employer" | "candidate",
): Promise<HiddenOpportunity[]> {
  const thread = await fetchItem(threadId);
  if (!thread?.id) return [];

  const maxComments = Math.min(
    Math.max(Number.parseInt(process.env.HIDDEN_HN_COMMENTS_PER_THREAD || "120", 10) || 120, 10),
    300,
  );

  const opportunities: HiddenOpportunity[] = [];
  const threadCard = threadToOpportunity(thread, category);
  if (threadCard) opportunities.push(threadCard);

  const kidIds = (thread.kids ?? []).slice(0, maxComments);
  const comments = await mapInBatches(kidIds, 25, async (kidId) => {
    const comment = await fetchItem(kidId);
    if (!comment) return null;
    return commentToOpportunity(comment, threadId, category);
  });

  opportunities.push(...comments.filter((c): c is HiddenOpportunity => c != null));
  return opportunities;
}

/**
 * Latest "Who is hiring" / "Who wants to be hired" threads plus top-level job comments.
 * Thread IDs from HN Algolia search; comment bodies from the official Firebase API.
 */
export async function fetchHackerNewsOpportunities(): Promise<HiddenOpportunity[]> {
  const threadsPerQuery = Math.min(
    Math.max(Number.parseInt(process.env.HIDDEN_HN_THREADS_PER_QUERY || "2", 10) || 2, 1),
    5,
  );

  const all: HiddenOpportunity[] = [];
  const seen = new Set<string>();

  for (const { query, category } of THREAD_QUERIES) {
    const hits = await findHiringThreadIds(query, threadsPerQuery + 8);
    const validIds: number[] = [];
    for (const threadId of hits) {
      const item = await fetchItem(threadId);
      if (item?.title && isHiringMegathreadTitle(item.title, category)) {
        validIds.push(threadId);
      }
      if (validIds.length >= threadsPerQuery) break;
    }

    for (const threadId of validIds) {
      const batch = await fetchThreadOpportunities(threadId, category);
      for (const opp of batch) {
        if (seen.has(opp.id)) continue;
        seen.add(opp.id);
        all.push(opp);
      }
    }
  }

  if (all.length === 0) {
    throw new Error("No Hacker News hiring threads or comments found");
  }

  return all;
}
