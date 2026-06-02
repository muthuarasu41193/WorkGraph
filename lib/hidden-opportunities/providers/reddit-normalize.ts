import { isEmployerHiringPost } from "../hiring-filter";
import { scoreOpportunity } from "../ranking";
import type { HiddenOpportunity, RedditRawOpportunity } from "../types";

export function normalizeRedditPost(raw: RedditRawOpportunity): HiddenOpportunity {
  const employer = isEmployerHiringPost({
    title: raw.title,
    body: raw.selftext,
    subreddit: raw.category,
    source: "reddit",
    linkFlair: raw.linkFlair,
  });

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
    tags: employer ? ["reddit", raw.category, "hiring"] : ["reddit", raw.category, "for-hire"],
  });
}
