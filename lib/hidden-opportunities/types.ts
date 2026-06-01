/** Canonical opportunity returned by /api/hidden-jobs */
export type HiddenOpportunity = {
  id: string;
  source: HiddenOpportunitySource;
  title: string;
  company?: string;
  location?: string;
  url: string;
  author?: string;
  postedAt: string;
  tags: string[];
  score: number;
  category?: string;
};

export type HiddenOpportunitySource = "reddit" | "hackernews" | "github";

export const HIDDEN_OPPORTUNITY_SOURCES: HiddenOpportunitySource[] = [
  "reddit",
  "hackernews",
  "github",
];

/** Intermediate shape from Reddit provider */
export type RedditRawOpportunity = {
  id: string;
  source: "reddit";
  title: string;
  url: string;
  author: string;
  postedAt: string;
  category: string;
};

export type HiddenJobsQuery = {
  q?: string;
  source?: HiddenOpportunitySource;
  remote?: boolean;
  country?: string;
  postedWithinDays?: number;
  sort?: "newest" | "relevant";
  limit?: number;
};

export type HiddenJobsResponse = {
  ok: boolean;
  opportunities: HiddenOpportunity[];
  meta: {
    total: number;
    filtered: number;
    cached: boolean;
    cachedAt: string | null;
    expiresAt: string | null;
    sources: Partial<Record<HiddenOpportunitySource, number>>;
    providerErrors?: Partial<Record<HiddenOpportunitySource, string>>;
  };
};

export type HiddenJobAnalyticsEvent = "view" | "click" | "save";

export type HiddenJobAnalyticsBody = {
  opportunityId: string;
  event: HiddenJobAnalyticsEvent;
  source?: string;
};
