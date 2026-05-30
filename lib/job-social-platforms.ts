import type { JobFeedSource, RecommendedJobCard } from "./job-dashboard";

/** Social platforms shown in the Job Posts tab. */
export type SocialPlatform = "all" | "reddit" | "x" | "linkedin" | "facebook" | "other";

export const SOCIAL_PLATFORM_TABS: { id: SocialPlatform; label: string }[] = [
  { id: "all", label: "All posts" },
  { id: "reddit", label: "Reddit" },
  { id: "x", label: "X" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "facebook", label: "Facebook" },
  { id: "other", label: "Other" },
];

export function socialPlatformForSource(source: JobFeedSource): Exclude<SocialPlatform, "all"> {
  if (source === "reddit") return "reddit";
  if (source === "x") return "x";
  if (source === "linkedin") return "linkedin";
  if (source === "facebook") return "facebook";
  return "other";
}

export function filterPostsByPlatform(
  posts: RecommendedJobCard[],
  platform: SocialPlatform,
): RecommendedJobCard[] {
  const community = posts.filter((p) => p.isCommunity || p.kind === "post");
  if (platform === "all") return community;
  return community.filter((p) => socialPlatformForSource(p.source) === platform);
}

export function countPostsByPlatform(posts: RecommendedJobCard[]): Record<SocialPlatform, number> {
  const community = posts.filter((p) => p.isCommunity || p.kind === "post");
  const counts: Record<SocialPlatform, number> = {
    all: community.length,
    reddit: 0,
    x: 0,
    linkedin: 0,
    facebook: 0,
    other: 0,
  };
  for (const post of community) {
    counts[socialPlatformForSource(post.source)] += 1;
  }
  return counts;
}
