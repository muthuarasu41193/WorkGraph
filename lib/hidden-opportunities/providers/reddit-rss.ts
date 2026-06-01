import { scoreOpportunity } from "../ranking";
import type { HiddenOpportunity, RedditRawOpportunity } from "../types";

export function redditUserAgent(): string {
  return (
    process.env.REDDIT_USER_AGENT?.trim() ||
    process.env.HIDDEN_REDDIT_USER_AGENT?.trim() ||
    "windows:workgraph:hidden-jobs:1.0.0 (by /u/workgraphapp)"
  );
}

function atomTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match?.[1]) return "";
  return match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function atomLinkHref(block: string): string {
  const match = block.match(/<link[^>]+href=["']([^"']+)["']/i);
  return match?.[1]?.trim() ?? "";
}

function postIdFromAtomId(atomId: string): string {
  const match = atomId.match(/t3_([a-z0-9]+)/i);
  return match?.[1] ?? atomId.replace(/\W/g, "").slice(0, 12);
}

export function parseRedditAtomFeed(xml: string, subreddit: string): RedditRawOpportunity[] {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/gi) ?? [];
  const results: RedditRawOpportunity[] = [];

  for (const block of entries) {
    const title = atomTag(block, "title");
    const url = atomLinkHref(block);
    if (!title || !url) continue;

    const atomId = atomTag(block, "id");
    const postId = postIdFromAtomId(atomId || url);
    const published = atomTag(block, "published") || atomTag(block, "updated");
    const postedAt = published ? new Date(published).toISOString() : new Date().toISOString();

    const authorRaw = atomTag(block, "name");
    const author = authorRaw
      ? authorRaw.startsWith("/u/")
        ? authorRaw
        : authorRaw.startsWith("u/")
          ? `/${authorRaw}`
          : `/u/${authorRaw.replace(/^\/?u\//i, "")}`
      : "unknown";

    results.push({
      id: `reddit:${subreddit}:${postId}`,
      source: "reddit",
      title,
      url,
      author,
      postedAt,
      category: subreddit,
    });
  }

  return results;
}

export function redditRssToOpportunities(raw: RedditRawOpportunity[]): HiddenOpportunity[] {
  return raw.map((item) =>
    scoreOpportunity({
      id: item.id,
      source: "reddit",
      title: item.title,
      url: item.url,
      author: item.author,
      company: `r/${item.category}`,
      postedAt: item.postedAt,
      category: item.category,
      tags: ["reddit", item.category],
    }),
  );
}

export async function fetchSubredditRss(subreddit: string): Promise<HiddenOpportunity[]> {
  const slug = subreddit.trim().replace(/^r\//i, "");
  if (!slug) return [];

  const res = await fetch(`https://www.reddit.com/r/${encodeURIComponent(slug)}/new.rss`, {
    headers: {
      Accept: "application/atom+xml, application/xml, text/xml",
      "User-Agent": redditUserAgent(),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Reddit RSS HTTP ${res.status} for r/${slug}`);
  }

  const xml = await res.text();
  const raw = parseRedditAtomFeed(xml, slug);
  return redditRssToOpportunities(raw);
}
