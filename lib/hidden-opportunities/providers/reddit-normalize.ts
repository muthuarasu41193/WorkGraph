import { scoreOpportunity } from "../ranking";
import type { HiddenOpportunity, RedditRawOpportunity } from "../types";

export function normalizeRedditPost(raw: RedditRawOpportunity): HiddenOpportunity {
  return scoreOpportunity({
    id: raw.id,
    source: "reddit",
    title: raw.title,
    url: raw.url,
    author: raw.author,
    company: `r/${raw.category}`,
    location: undefined,
    postedAt: raw.postedAt,
    category: raw.category,
    tags: ["reddit", raw.category],
  });
}
