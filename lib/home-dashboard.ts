import { fetchAllHiddenOpportunities } from "@/lib/hidden-opportunities/aggregate";
import { formatCurrencyAmount } from "@/lib/currency";
import type { HiddenOpportunity } from "@/lib/hidden-opportunities/types";
import type { JobPipelineCounts, RecommendedJobCard } from "@/lib/job-dashboard";
import type { JobMatchPreview } from "@/lib/profile-mock-data";
import { toSentenceCase } from "@/lib/sentence-case";
import type { Profile } from "@/lib/types";
import { workgraphApiEnabled } from "@/lib/workgraph-api";
import { workgraphBffFetch } from "@/lib/workgraph-bff";
import type { DashboardSnapshot, WalletSummary } from "@/packages/shared/types/phase3";

export type HomeStatCards = {
  /** Catalog jobs matched to the user's profile (same source as Jobs tab). */
  newMatches: number;
  followUpsDue: number;
  applicationsThisWeek: number;
  hiddenJobsFound: number;
  pendingApplications: number;
  vaultEarningsInr: number;
  vaultEarningsCurrency: string;
};

export type HomeVaultStats = {
  views: number;
  earningsInr: number;
  rating: number;
  ratingCount: number;
};

export type JobMarketPulse = {
  trendingRoles: { title: string; growth: string }[];
  trendingSkills: string[];
};

export type JobMatchPreviewExt = JobMatchPreview & {
  applyUrl?: string;
  postedAgo?: string;
};

function inferWorkMode(location: string): JobMatchPreview["workMode"] {
  const l = location.toLowerCase();
  if (l.includes("remote")) return "Remote";
  if (l.includes("hybrid")) return "Hybrid";
  return "On-site";
}

function jobCardsToMatches(jobs?: RecommendedJobCard[]): JobMatchPreviewExt[] {
  if (!jobs?.length) return [];
  return jobs.slice(0, 6).map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    matchPercent: parseMatchPercent(job.matchLabel),
    salaryRange: "See listing",
    workMode: inferWorkMode(job.location),
    location: job.location,
    applyUrl: job.applyUrl ?? undefined,
    postedAgo: job.postedAgo,
  }));
}

export function resolveProfileJobMatches(
  semantic?: JobMatchPreviewExt[] | null,
  jobs?: RecommendedJobCard[],
): JobMatchPreviewExt[] {
  if (semantic?.length) return semantic.slice(0, 12);
  return jobCardsToMatches(jobs);
}

export type HomeDashboardData = {
  displayName: string;
  greeting: string;
  stats: HomeStatCards;
  topMatches: JobMatchPreviewExt[];
  hiddenFeed: HiddenOpportunity[];
  hiddenFeedLive: boolean;
  vault: HomeVaultStats;
  marketPulse: JobMarketPulse;
  feedKind: "live" | "demo";
};

export function getTimeGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getProfileFirstName(profile: Pick<Profile, "full_name" | "email">): string {
  const fromName = profile.full_name?.trim().split(/\s+/)[0];
  if (fromName) return toSentenceCase(fromName);
  const emailLocal = profile.email?.split("@")[0]?.trim();
  if (emailLocal) return toSentenceCase(emailLocal);
  return "there";
}

function parseMatchPercent(label: string): number {
  const matchPct = label.match(/(\d{1,3})%\s*match/i);
  if (matchPct) return Math.min(99, Math.max(48, Number(matchPct[1])));
  const m = label.match(/(\d{1,3})/);
  if (!m) return 75;
  return Math.min(99, Math.max(48, Number(m[1])));
}

function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Count applications whose applied_date falls within the last 7 days (inclusive of today). */
export function countApplicationsThisWeek(
  applications: { applied_date: string }[],
  now = new Date(),
): number {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  const startKey = localDateKey(start);
  const endKey = localDateKey(end);

  return applications.filter((app) => {
    const day = app.applied_date.slice(0, 10);
    return day >= startKey && day <= endKey;
  }).length;
}

export function formatInr(amount: number): string {
  return formatCurrencyAmount(amount, "INR");
}

export function centsToInr(cents: number, currency = "INR"): number {
  const major = cents / 100;
  if (currency.toUpperCase() === "INR") return major;
  return Math.round(major * 83);
}

export function buildJobMarketPulse(
  profile: Pick<Profile, "skills" | "headline">,
  jobs: RecommendedJobCard[],
): JobMarketPulse {
  const roleCounts = new Map<string, number>();
  for (const job of jobs.slice(0, 40)) {
    const key = job.title.trim();
    if (!key) continue;
    roleCounts.set(key, (roleCounts.get(key) ?? 0) + 1);
  }

  const trendingRoles = [...roleCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([title]) => ({
      title,
      growth: `${roleCounts.get(title) ?? 0} listings`,
    }));

  const skillSet = new Set<string>(profile.skills.slice(0, 8));
  for (const job of jobs) {
    for (const skill of job.matchedSkills.slice(0, 2)) {
      if (skillSet.size >= 8) break;
      skillSet.add(skill.charAt(0).toUpperCase() + skill.slice(1));
    }
  }

  const headline = profile.headline?.toLowerCase() ?? "";
  if (headline.includes("data")) skillSet.add("Python");
  if (headline.includes("frontend")) skillSet.add("React");

  return {
    trendingRoles: trendingRoles.slice(0, 5),
    trendingSkills: [...skillSet].slice(0, 8),
  };
}

export async function loadHiddenJobsFeed(limit = 5): Promise<{
  items: HiddenOpportunity[];
  total: number;
}> {
  const payload = await fetchAllHiddenOpportunities({ sort: "newest", limit: 50 });
  return {
    items: payload.opportunities.slice(0, limit),
    total: payload.meta.total,
  };
}

export async function loadWalletSnapshot(): Promise<WalletSummary | null> {
  if (!workgraphApiEnabled()) return null;
  try {
    const data = await workgraphBffFetch<{ dashboard: DashboardSnapshot; wallet: WalletSummary }>(
      "/wallet/dashboard",
    );
    return data.wallet;
  } catch {
    return null;
  }
}

export function buildHomeStats(input: {
  matchedListings: number;
  pipeline: JobPipelineCounts;
  hiddenTotal: number;
  wallet: WalletSummary | null;
  vaultEarningsInrOverride?: number | null;
  followUpsDue?: number;
  applicationsThisWeek?: number;
}): HomeStatCards {
  const vaultEarningsInr =
    input.vaultEarningsInrOverride ??
    (input.wallet ? centsToInr(input.wallet.lifetime_earned_cents, input.wallet.currency) : 0);

  return {
    newMatches: Math.max(0, input.matchedListings),
    followUpsDue: input.followUpsDue ?? 0,
    applicationsThisWeek: input.applicationsThisWeek ?? 0,
    hiddenJobsFound: input.hiddenTotal,
    pendingApplications: input.pipeline.applied,
    vaultEarningsInr,
    vaultEarningsCurrency: "INR",
  };
}

export function buildVaultStats(wallet: WalletSummary | null): HomeVaultStats {
  const earningsInr = wallet ? centsToInr(wallet.lifetime_earned_cents, wallet.currency) : 0;
  return {
    views: 0,
    earningsInr,
    rating: 0,
    ratingCount: 0,
  };
}

export type BuildHomeDashboardInput = {
  profile: Profile;
  recommendedJobs: RecommendedJobCard[];
  semanticJobMatches: JobMatchPreviewExt[] | null;
  jobPipeline: JobPipelineCounts;
  /** Catalog-wide profile match count — same query as the Jobs tab. */
  matchedListings: number;
  feedKind: "live" | "demo";
  hiddenFeed: HiddenOpportunity[];
  hiddenTotal: number;
  wallet: WalletSummary | null;
  vaultEarningsInr?: number | null;
  followUpsDue?: number;
  applicationsThisWeek?: number;
};

export function buildHomeDashboardData(input: BuildHomeDashboardInput): HomeDashboardData {
  const topMatches = resolveProfileJobMatches(
    input.semanticJobMatches,
    input.recommendedJobs,
  ).slice(0, 5);

  const stats = buildHomeStats({
    matchedListings: input.matchedListings,
    pipeline: input.jobPipeline,
    hiddenTotal: input.hiddenTotal,
    wallet: input.wallet,
    vaultEarningsInrOverride: input.vaultEarningsInr,
    followUpsDue: input.followUpsDue ?? 0,
    applicationsThisWeek: input.applicationsThisWeek ?? 0,
  });

  return {
    displayName: getProfileFirstName(input.profile),
    greeting: getTimeGreeting(),
    stats,
    topMatches,
    hiddenFeed: input.hiddenFeed,
    hiddenFeedLive: input.hiddenFeed.length > 0,
    vault: buildVaultStats(input.wallet),
    marketPulse: buildJobMarketPulse(input.profile, input.recommendedJobs),
    feedKind: input.feedKind,
  };
}

export function resolveTopJobMatches(
  semantic: JobMatchPreviewExt[] | null | undefined,
  jobs: RecommendedJobCard[],
  limit = 5,
): JobMatchPreviewExt[] {
  return resolveProfileJobMatches(semantic, jobs).slice(0, limit);
}

export type { DashboardSnapshot };
