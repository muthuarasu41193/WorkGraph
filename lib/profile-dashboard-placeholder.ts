/**
 * Placeholder pipeline + recommended roles until job feeds / tracker APIs ship.
 * Replace `getPipelineCountsForProfile` with Supabase aggregates on `job_applications`.
 */

export type JobPipelineCounts = {
  applied: number;
  interview: number;
  offers: number;
  saved: number;
};

export type RecommendedJobSource = "linkedin" | "reddit" | "indeed" | "glassdoor" | "levels";

export type RecommendedJobPlaceholder = {
  id: string;
  title: string;
  company: string;
  location: string;
  source: RecommendedJobSource;
  /** Shown as match hint until real scoring exists */
  matchLabel: string;
  postedAgo: string;
};

/** Defaults — swap for live counts from your backend */
export async function getPipelineCountsForProfile(userId: string): Promise<JobPipelineCounts> {
  void userId;
  return {
    applied: 0,
    interview: 0,
    offers: 0,
    saved: 0,
  };
}

export const PLACEHOLDER_RECOMMENDED_JOBS: RecommendedJobPlaceholder[] = [
  {
    id: "demo-1",
    title: "Senior Frontend Engineer",
    company: "Northwind Labs",
    location: "Remote · US",
    source: "linkedin",
    matchLabel: "Strong React overlap",
    postedAgo: "2d ago",
  },
  {
    id: "demo-2",
    title: "Staff Product Engineer",
    company: "Atlas AI",
    location: "Hybrid · NYC",
    source: "levels",
    matchLabel: "Staff-level scope match",
    postedAgo: "5h ago",
  },
  {
    id: "demo-3",
    title: "Full Stack (TypeScript)",
    company: "Cobalt Health",
    location: "Remote",
    source: "reddit",
    matchLabel: "r/forhire — high engagement",
    postedAgo: "1d ago",
  },
  {
    id: "demo-4",
    title: "Platform Engineer",
    company: "Riverstone",
    location: "Austin, TX",
    source: "indeed",
    matchLabel: "Infra keywords align",
    postedAgo: "3d ago",
  },
  {
    id: "demo-5",
    title: "Engineering Manager",
    company: "Brightwave",
    location: "Remote · EU",
    source: "glassdoor",
    matchLabel: "Leadership + IC hybrid",
    postedAgo: "6d ago",
  },
];
