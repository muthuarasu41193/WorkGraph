/**
 * Secondary caption for community SourceBadges: subreddit for Reddit posts,
 * otherwise author (falling back to company).
 */
export function communitySourceSecondary(post: {
  source?: string | null;
  category?: string | null;
  company?: string | null;
  author?: string | null;
}): string | null {
  const source = post.source?.trim().toLowerCase() ?? "";

  if (source === "reddit") {
    const raw = (post.category || post.company || "").trim();
    if (raw) {
      const name = raw.replace(/^r\//i, "");
      return name ? `r/${name}` : null;
    }
    return post.author?.trim() || null;
  }

  return post.author?.trim() || post.company?.trim() || null;
}
