import { fetchJson } from "../http";
import { fetchSubredditRss, redditUserAgent } from "./reddit-rss";
import type { HiddenOpportunity, RedditRawOpportunity } from "../types";
import { normalizeRedditPost } from "./reddit-normalize";

export { normalizeRedditPost } from "./reddit-normalize";

export const REDDIT_SUBREDDITS = [
  "forhire",
  "jobs",
  "remotejobs",
  "remotework",
  "freelance",
  "cscareerquestions",
] as const;

type RedditListing = {
  data?: {
    id?: string;
    title?: string;
    url?: string;
    author?: string;
    created_utc?: number;
    subreddit?: string;
    permalink?: string;
    is_self?: boolean;
  };
};

function toIso(createdUtc?: number): string {
  if (!createdUtc) return new Date().toISOString();
  return new Date(createdUtc * 1000).toISOString();
}

async function fetchSubredditJson(subreddit: string, limit: number): Promise<HiddenOpportunity[]> {
  const payload = await fetchJson<{ data?: { children?: RedditListing[] } }>(
    `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/new.json?limit=${limit}`,
    {
      headers: {
        "User-Agent": redditUserAgent(),
        Accept: "application/json",
      },
    },
  );

  const results: HiddenOpportunity[] = [];

  for (const child of payload.data?.children ?? []) {
    const post = child.data;
    if (!post?.id || !post.title) continue;

    const permalink = post.permalink
      ? `https://www.reddit.com${post.permalink}`
      : `https://www.reddit.com/r/${subreddit}/comments/${post.id}`;
    const externalUrl =
      post.url && !post.is_self && !post.url.includes("reddit.com") ? post.url : permalink;

    const raw: RedditRawOpportunity = {
      id: `reddit:${subreddit}:${post.id}`,
      source: "reddit",
      title: post.title.trim(),
      url: externalUrl,
      author: post.author ? `u/${post.author}` : "unknown",
      postedAt: toIso(post.created_utc),
      category: post.subreddit || subreddit,
    };

    results.push(normalizeRedditPost(raw));
  }

  return results;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reddit often returns 403 for `.json` on cloud hosts. Public Atom RSS (`/new.rss`) is used as the
 * primary source; JSON is attempted when RSS fails.
 */
export async function fetchRedditOpportunities(): Promise<HiddenOpportunity[]> {
  const limit = Math.min(
    Math.max(Number.parseInt(process.env.HIDDEN_REDDIT_LIMIT || "25", 10) || 25, 5),
    100,
  );
  const subreddits =
    process.env.HIDDEN_REDDIT_SUBREDDITS?.split(",").map((s) => s.trim().replace(/^r\//i, "")).filter(Boolean) ??
    [...REDDIT_SUBREDDITS];

  const results: HiddenOpportunity[] = [];
  const seenUrls = new Set<string>();
  const errors: string[] = [];
  const gapMs = Math.max(
    Number.parseInt(process.env.HIDDEN_REDDIT_REQUEST_GAP_MS || "350", 10) || 350,
    100,
  );

  for (const subreddit of subreddits) {
    let batch: HiddenOpportunity[] = [];

    try {
      batch = await fetchSubredditRss(subreddit);
    } catch (rssErr) {
      const rssMessage = rssErr instanceof Error ? rssErr.message : String(rssErr);
      try {
        batch = await fetchSubredditJson(subreddit, limit);
      } catch (jsonErr) {
        const jsonMessage = jsonErr instanceof Error ? jsonErr.message : String(jsonErr);
        errors.push(`r/${subreddit}: RSS (${rssMessage}); JSON (${jsonMessage})`);
        continue;
      }
    }

    for (const item of batch) {
      const key = item.url.toLowerCase();
      if (seenUrls.has(key)) continue;
      seenUrls.add(key);
      results.push(item);
    }

    await delay(gapMs);
  }

  if (results.length === 0 && errors.length > 0) {
    throw new Error(errors.join(" | "));
  }

  return results;
}
