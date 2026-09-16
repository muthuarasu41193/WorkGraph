/**
 * Honest landing-page social proof helpers (client-safe).
 * Postgres queries live in lib/social-proof-server.ts so the service role never ships to the browser.
 */

export const MIN_DISPLAY_THRESHOLD = 25;
export const EARLY_STAGE_COPY = "We launched this month. Be one of the first.";
export const CACHE_TTL_MS = 10 * 60 * 1000;
export const TEAM_MEMBER_DISCLOSURE = "WorkGraph team member";

export type SocialProofCounts = {
  signups: number;
  publishedGuides: number;
  verifiedOutcomes: number;
};

export type DisplayCount = {
  value: number;
  display: string;
  showNumber: boolean;
};

export type TestimonialRow = {
  id: string;
  author_name: string;
  author_title: string | null;
  quote: string;
  consent_given_at: string | null;
  is_employee: boolean;
  verified_outcome: string | null;
  source: string | null;
};

export type SocialProofQueries = {
  countSignups(): Promise<number>;
  countPublishedGuides(): Promise<number>;
  countVerifiedOutcomes(): Promise<number>;
};

export type GetRealCountsOptions = {
  store?: SocialProofQueries;
  now?: number;
};

type CountsCache = { at: number; value: SocialProofCounts };
let countsCache: CountsCache | null = null;

export function resetSocialProofCache(): void {
  countsCache = null;
}

export function displayCount(value: number): DisplayCount {
  const n = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  if (n < MIN_DISPLAY_THRESHOLD) {
    return { value: n, display: EARLY_STAGE_COPY, showNumber: false };
  }
  return { value: n, display: n.toLocaleString("en-US"), showNumber: true };
}

export function filterConsentedTestimonials(rows: TestimonialRow[]): TestimonialRow[] {
  return rows.filter((row) => row.consent_given_at != null && row.consent_given_at !== "");
}

export function teamMemberDisclosure(isEmployee: boolean): string | null {
  return isEmployee ? TEAM_MEMBER_DISCLOSURE : null;
}

export async function getRealCounts(
  options: GetRealCountsOptions = {},
): Promise<SocialProofCounts> {
  const now = options.now ?? Date.now();
  if (countsCache && now - countsCache.at < CACHE_TTL_MS) {
    return countsCache.value;
  }

  let store = options.store;
  if (!store) {
    const { postgresSocialProofStore } = await import("./social-proof-server");
    store = postgresSocialProofStore();
  }

  const [signups, publishedGuides, verifiedOutcomes] = await Promise.all([
    store.countSignups(),
    store.countPublishedGuides(),
    store.countVerifiedOutcomes(),
  ]);

  const value: SocialProofCounts = {
    signups: signups || 0,
    publishedGuides: publishedGuides || 0,
    verifiedOutcomes: verifiedOutcomes || 0,
  };
  countsCache = { at: now, value };
  return value;
}
