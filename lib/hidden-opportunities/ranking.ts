import type { HiddenOpportunity } from "./types";

const BOOST_KEYWORDS: Array<{ pattern: RegExp; boost: number; tag: string }> = [
  { pattern: /\bremote\b/i, boost: 18, tag: "remote" },
  { pattern: /\bworldwide\b/i, boost: 14, tag: "worldwide" },
  { pattern: /\burgent\b.*\bhiring\b/i, boost: 22, tag: "urgent" },
  { pattern: /\bhiring\s+now\b/i, boost: 20, tag: "hiring-now" },
  { pattern: /\bcontract\b/i, boost: 12, tag: "contract" },
  { pattern: /\bfreelance\b/i, boost: 12, tag: "freelance" },
];

function recencyBoost(postedAt: string): number {
  const ms = Date.parse(postedAt);
  if (Number.isNaN(ms)) return 0;
  const ageHours = (Date.now() - ms) / 3_600_000;
  if (ageHours <= 24) return 30;
  if (ageHours <= 72) return 22;
  if (ageHours <= 168) return 14;
  if (ageHours <= 720) return 6;
  return 0;
}

export function scoreOpportunity(
  base: Omit<HiddenOpportunity, "score" | "tags"> & { tags?: string[] },
): HiddenOpportunity {
  const text = [base.title, base.company, base.location, base.category].filter(Boolean).join(" ");
  const tags = new Set<string>(base.tags ?? []);
  let score = 10;

  for (const { pattern, boost, tag } of BOOST_KEYWORDS) {
    if (pattern.test(text)) {
      score += boost;
      tags.add(tag);
    }
  }

  score += recencyBoost(base.postedAt);

  if (/\bremote\b/i.test(text) && !tags.has("remote")) tags.add("remote");

  return {
    ...base,
    tags: [...tags],
    score: Math.round(score),
  };
}

export function sortOpportunities(
  items: HiddenOpportunity[],
  sort: "newest" | "relevant",
): HiddenOpportunity[] {
  const copy = [...items];
  if (sort === "newest") {
    copy.sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt));
  } else {
    copy.sort((a, b) => b.score - a.score || Date.parse(b.postedAt) - Date.parse(a.postedAt));
  }
  return copy;
}
