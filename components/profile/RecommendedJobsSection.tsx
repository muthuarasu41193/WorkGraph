"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  LayoutGrid,
  LayoutList,
  LifeBuoy,
  Loader2,
  SearchX,
  Search,
  SlidersHorizontal,
  TriangleAlert,
  UserSearch,
  X,
} from "lucide-react";
import {
  resolveDashboardRouteFromSearchParams,
  resolveJobsLayoutFromSearchParams,
} from "@/lib/dashboard-routes";
import type { FeedDemoHint, JobFeedSource, RecommendedJobCard } from "../../lib/job-dashboard";
import {
  applyClientOnlyJobListingFilters,
  applyJobListingFilters,
  hasAnyUserJobFilters,
  needsJobClientFilterPool,
  type JobListingFilterState,
} from "../../lib/job-listing-filters";
import { LIVE_JOBS_CLIENT_FILTER_CAP } from "../../lib/jobs-catalog";
import { scoreJobCard, type ProfileMatchInput } from "../../lib/job-match";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { iconClass } from "@/lib/icon-styles";
import { emitNavFeedback } from "@/lib/nav-feedback-events";
import JobCard from "@/components/design-system/JobCard";
import JobApplyButton from "@/components/design-system/JobApplyButton";
import ApplyFollowupPrompt from "@/components/design-system/ApplyFollowupPrompt";
import ResumeIntelligenceDialog from "@/components/talent-intelligence/ResumeIntelligenceDialog";
import { recommendedJobToCardData } from "@/lib/job-card-data";
import { readSavedJobIds, saveJobId, toggleSavedJobId } from "@/lib/saved-jobs-storage";
import { useDashboardContext } from "@/components/dashboard/DashboardProvider";
import "@/components/design-system/job-card.css";
import "@/components/profile/right-sidebar.css";

import { WG_PLATFORM_CHIP_CLASS } from "@/lib/design-tokens";

const SOURCE_LABELS: Record<RecommendedJobCard["source"], string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  adzuna: "Adzuna",
  usajobs: "USAJobs",
  workday: "Workday",
  smartrecruiters: "SmartRecruiters",
  ashby: "Ashby",
  jobvite: "Jobvite",
  bamboohr: "BambooHR",
  icims: "iCIMS",
  taleo: "Taleo",
  linkedin: "LinkedIn",
  reddit: "Reddit",
  x: "X",
  remoteok: "RemoteOK",
  remotejobs: "RemoteJobs.org",
  hackernews: "Hacker News",
  jobicy: "Jobicy",
  arbeitnow: "Arbeitnow",
  indeed: "Indeed",
  glassdoor: "Glassdoor",
  levels: "Levels.fyi",
  facebook: "Facebook",
  rss: "RSS",
  workgraph: "WorkGraph Direct",
  other: "Other ATS",
};

const SOURCE_STYLES = Object.fromEntries(
  (Object.keys(SOURCE_LABELS) as RecommendedJobCard["source"][]).map((source) => [
    source,
    { label: SOURCE_LABELS[source], className: WG_PLATFORM_CHIP_CLASS },
  ]),
) as Record<RecommendedJobCard["source"], { label: string; className: string }>;

const DATE_OPTIONS = [
  { id: "any" as const, label: "Any time" },
  { id: "1" as const, label: "Past 24h" },
  { id: "7" as const, label: "Last 7 days" },
  { id: "30" as const, label: "Last 30 days" },
];

const SORT_PARAM_VALUES = ["best", "newest", "salary_desc", "salary_asc", "company_asc"] as const;
type SortOption = (typeof SORT_PARAM_VALUES)[number];

const SORT_OPTIONS = [
  { id: "best" as const, label: "Best Match" },
  { id: "newest" as const, label: "Newest First" },
  { id: "salary_desc" as const, label: "Salary: High to Low" },
  { id: "salary_asc" as const, label: "Salary: Low to High" },
  { id: "company_asc" as const, label: "Company Name A-Z" },
] as const satisfies ReadonlyArray<{ id: SortOption; label: string }>;
const JOB_TYPE_OPTIONS = ["Full-time", "Part-time", "Contract", "Freelance", "Internship", "Temporary"] as const;
const EXPERIENCE_OPTIONS = [
  "Entry (0-2yr)",
  "Mid (2-5yr)",
  "Senior (5-8yr)",
  "Lead (8-12yr)",
  "Executive (12yr+)",
] as const;
const COMPANY_SIZE_OPTIONS = [
  "Startup (1-50)",
  "Small (51-200)",
  "Medium (201-1000)",
  "Large (1000+)",
  "Enterprise (10K+)",
] as const;
const BENEFIT_OPTIONS = ["Health", "401k", "Equity", "Remote-first"] as const;
const INDUSTRY_KEYWORDS = {
  Technology: ["software", "engineer", "developer", "saas", "ai", "platform", "data", "cloud"],
  Finance: ["finance", "fintech", "bank", "payments", "trading", "risk"],
  Healthcare: ["health", "clinical", "med", "biotech", "hospital", "pharma"],
  Marketing: ["marketing", "growth", "seo", "brand", "content", "demand gen"],
  Design: ["design", "ux", "ui", "product design", "figma"],
  Legal: ["legal", "law", "compliance", "counsel", "contract law"],
  Education: ["education", "edtech", "curriculum", "teacher", "learning"],
  Retail: ["retail", "commerce", "ecommerce", "merchant", "shopper"],
} as const;
const INDUSTRY_OPTIONS = Object.keys(INDUSTRY_KEYWORDS) as Array<keyof typeof INDUSTRY_KEYWORDS>;
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "EUR ",
  GBP: "GBP ",
  INR: "INR ",
};
const JOB_FEED_SOURCE_OPTIONS = [
  "greenhouse",
  "lever",
  "adzuna",
  "usajobs",
  "workday",
  "smartrecruiters",
  "ashby",
  "jobvite",
  "bamboohr",
  "icims",
  "taleo",
  "linkedin",
  "reddit",
  "x",
  "remoteok",
  "remotejobs",
  "hackernews",
  "jobicy",
  "arbeitnow",
  "indeed",
  "glassdoor",
  "levels",
  "workgraph",
  "other",
] as const satisfies readonly JobFeedSource[];
const MATCH_SCORE_OPTIONS = ["any", "90", "75", "60"] as const;
const DATE_WINDOW_OPTIONS = ["any", "1", "7", "30"] as const;
const LOCATION_MODE_OPTIONS = ["any", "remote", "hybrid", "onsite"] as const;
const SALARY_PERIOD_OPTIONS = ["year", "hour"] as const;
const VIEW_MODE_OPTIONS = ["list", "grid"] as const;
const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "INR"] as const;

const PAGE_SIZE = 50;
const MAX_PAGINATION_TOKENS = 7;

type PaginationToken = number | "ellipsis";

function buildPaginationTokens(current: number, totalPages: number): PaginationToken[] {
  if (totalPages <= 1) return [1];
  if (totalPages <= MAX_PAGINATION_TOKENS) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const tokens: PaginationToken[] = [1];
  const windowStart = Math.max(2, current - 1);
  const windowEnd = Math.min(totalPages - 1, current + 1);
  if (windowStart > 2) tokens.push("ellipsis");
  for (let page = windowStart; page <= windowEnd; page += 1) tokens.push(page);
  if (windowEnd < totalPages - 1) tokens.push("ellipsis");
  tokens.push(totalPages);
  return tokens;
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

function formatLocationFilterLabel(
  mode: "any" | "remote" | "hybrid" | "onsite",
  query: string,
): string {
  if (query.trim()) return query.trim();
  if (mode === "onsite") return "On-site";
  if (mode === "any") return "Any";
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

type JobTypeOption = (typeof JOB_TYPE_OPTIONS)[number];
type ExperienceFilterOption = (typeof EXPERIENCE_OPTIONS)[number];
type CompanySizeFilterOption = (typeof COMPANY_SIZE_OPTIONS)[number];
type BenefitOption = (typeof BENEFIT_OPTIONS)[number];
type IndustryOption = (typeof INDUSTRY_OPTIONS)[number];

type SalaryMeta = {
  minK: number;
  maxK: number;
  currency: string;
  period: "year" | "hour";
};

type DerivedJobMeta = {
  searchBlob: string;
  jobTypes: JobTypeOption[];
  primaryJobType: JobTypeOption | null;
  locationMode: "remote" | "hybrid" | "onsite";
  experienceLevel: ExperienceFilterOption | null;
  salary: SalaryMeta | null;
  companySize: CompanySizeFilterOption | null;
  industries: IndustryOption[];
  benefits: BenefitOption[];
  hasVisaSponsorship: boolean;
  isEasyApply: boolean;
};

function normalizeText(...parts: Array<string | null | undefined>): string {
  return parts
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join(" ")
    .toLowerCase();
}

function parseMoneyToK(rawValue: string, suffix: string | undefined, period: "year" | "hour"): number {
  const value = Number(rawValue.replace(/,/g, ""));
  if (Number.isNaN(value)) return 0;
  const normalizedSuffix = suffix?.toLowerCase();
  if (normalizedSuffix === "m") return Math.round(value * 1000);
  if (normalizedSuffix === "k") return Math.round(value);
  if (period === "hour") return Math.round(value);
  if (value >= 1000) return Math.round(value / 1000);
  return Math.round(value);
}

function inferSalary(text: string): SalaryMeta | null {
  const period: "year" | "hour" = /(per hour|hourly|\/\s*(?:h|hr|hour)\b)/i.test(text) ? "hour" : "year";
  const currencyRange =
    /\b(?:salary|compensation|pay(?:\s*range)?|hourly(?:\s+rate)?)\b[\s:]{0,12}(?:([$€£₹])\s*)?(\d[\d,]*(?:\.\d+)?)\s*([kKmM])?\s*(?:-|to|–|—)\s*(?:([$€£₹])\s*)?(\d[\d,]*(?:\.\d+)?)\s*([kKmM])?/i.exec(
      text
    ) ??
    /([$€£₹])\s*(\d[\d,]*(?:\.\d+)?)\s*([kKmM])?\s*(?:-|to|–|—)\s*(?:([$€£₹])\s*)?(\d[\d,]*(?:\.\d+)?)\s*([kKmM])?/i.exec(
      text
    );

  if (currencyRange) {
    const currencySymbol = currencyRange[1] || currencyRange[4] || "$";
    const currency =
      currencySymbol === "€" ? "EUR" : currencySymbol === "£" ? "GBP" : currencySymbol === "₹" ? "INR" : "USD";
    const minK = parseMoneyToK(currencyRange[2], currencyRange[3], period);
    const maxK = parseMoneyToK(currencyRange[5], currencyRange[6], period);
    if (minK > 0 && maxK > 0) {
      return {
        minK: Math.min(minK, maxK),
        maxK: Math.max(minK, maxK),
        currency,
        period,
      };
    }
  }

  const singleSalary =
    /\b(?:salary|compensation|pay(?:\s*range)?|hourly(?:\s+rate)?)\b[\s:]{0,12}(?:([$€£₹])\s*)?(\d[\d,]*(?:\.\d+)?)\s*([kKmM])?/i.exec(
      text
    ) ?? /([$€£₹])\s*(\d[\d,]*(?:\.\d+)?)\s*([kKmM])?\s*(?:per year|annual|annually|per hour|hourly|\/\s*(?:h|hr|hour)\b)/i.exec(text);

  if (!singleSalary) return null;

  const currencySymbol = singleSalary[1] || "$";
  const currency =
    currencySymbol === "€" ? "EUR" : currencySymbol === "£" ? "GBP" : currencySymbol === "₹" ? "INR" : "USD";
  const amountK = parseMoneyToK(singleSalary[2], singleSalary[3], period);
  if (amountK <= 0) return null;

  return {
    minK: amountK,
    maxK: amountK,
    currency,
    period,
  };
}

function mapYearsToExperience(maxYears: number): ExperienceFilterOption {
  if (maxYears <= 2) return "Entry (0-2yr)";
  if (maxYears <= 5) return "Mid (2-5yr)";
  if (maxYears <= 8) return "Senior (5-8yr)";
  if (maxYears <= 12) return "Lead (8-12yr)";
  return "Executive (12yr+)";
}

function inferExperienceLevel(text: string): ExperienceFilterOption | null {
  if (/\b(chief|c-suite|executive|director|vice president|vp\b|head of)\b/i.test(text)) {
    return "Executive (12yr+)";
  }
  if (/\b(principal|staff|lead|manager|architect)\b/i.test(text)) {
    return "Lead (8-12yr)";
  }
  if (/\b(senior|sr\.?)\b/i.test(text)) {
    return "Senior (5-8yr)";
  }
  if (/\b(mid[-\s]?level|mid level|intermediate)\b/i.test(text)) {
    return "Mid (2-5yr)";
  }
  if (/\b(entry[-\s]?level|junior|jr\.?|graduate|new grad|intern(ship)?)\b/i.test(text)) {
    return "Entry (0-2yr)";
  }

  const matches = Array.from(text.matchAll(/(\d{1,2})(?:\s*(?:\+|plus))?(?:\s*[-–]\s*(\d{1,2}))?\s*(?:years?|yrs?)/gi));
  if (matches.length === 0) return null;
  let maxYears = 0;
  for (const match of matches) {
    const start = Number(match[1] || 0);
    const end = Number(match[2] || 0);
    maxYears = Math.max(maxYears, start, end);
  }
  return maxYears > 0 ? mapYearsToExperience(maxYears) : null;
}

function inferJobTypes(text: string): JobTypeOption[] {
  const matches: JobTypeOption[] = [];
  if (/\bfull[-\s]?time\b|fulltime|\bpermanent\b/i.test(text)) matches.push("Full-time");
  if (/\bpart[-\s]?time\b|parttime/i.test(text)) matches.push("Part-time");
  if (/\bcontract(or)?\b|contract-to-hire|\bc2h\b/i.test(text)) matches.push("Contract");
  if (/\bfreelance(r)?\b/i.test(text)) matches.push("Freelance");
  if (/\bintern(ship)?\b|co-op|\bcoop\b/i.test(text)) matches.push("Internship");
  if (/\btemporary\b|\btemp\b|seasonal/i.test(text)) matches.push("Temporary");
  return matches;
}

function inferLocationMode(location: string, description: string): "remote" | "hybrid" | "onsite" {
  const text = normalizeText(location, description);
  if (/\bremote\b|work from home|work-from-home|\bwfh\b|distributed|fully remote|remote[-\s]?first/i.test(text)) {
    return "remote";
  }
  if (/\bhybrid\b|partially remote|flexible location/i.test(text)) return "hybrid";
  return "onsite";
}

function inferCompanySize(text: string): CompanySizeFilterOption | null {
  const rangeMatch = /(\d{1,3}(?:,\d{3})*)\s*(?:-|to|–|—)\s*(\d{1,3}(?:,\d{3})*)\s+(?:employees|people|team members)/i.exec(text);
  const plusMatch = /(\d{1,3}(?:,\d{3})*)\+\s*(?:employees|people|team members)/i.exec(text);

  const classify = (maxEmployees: number): CompanySizeFilterOption => {
    if (maxEmployees <= 50) return "Startup (1-50)";
    if (maxEmployees <= 200) return "Small (51-200)";
    if (maxEmployees <= 1000) return "Medium (201-1000)";
    if (maxEmployees < 10000) return "Large (1000+)";
    return "Enterprise (10K+)";
  };

  if (rangeMatch) {
    return classify(Math.max(Number(rangeMatch[1].replace(/,/g, "")), Number(rangeMatch[2].replace(/,/g, ""))));
  }
  if (plusMatch) {
    return classify(Number(plusMatch[1].replace(/,/g, "")));
  }
  if (/\b(startup|seed stage|series a|early stage)\b/i.test(text)) return "Startup (1-50)";
  if (/\bsmall team\b|\bgrowing team\b/i.test(text)) return "Small (51-200)";
  if (/\bmidsize\b|\bmid-size\b/i.test(text)) return "Medium (201-1000)";
  if (/\benterprise\b|\bglobal company\b/i.test(text)) return "Enterprise (10K+)";
  return null;
}

function inferIndustries(text: string): IndustryOption[] {
  return INDUSTRY_OPTIONS.filter((industry) => INDUSTRY_KEYWORDS[industry].some((keyword) => text.includes(keyword)));
}

function inferBenefits(text: string): BenefitOption[] {
  const benefits: BenefitOption[] = [];
  if (/\b(health insurance|medical|dental|vision)\b/i.test(text)) benefits.push("Health");
  if (/\b401k\b|\bretirement plan\b/i.test(text)) benefits.push("401k");
  if (/\bequity\b|\bstock options?\b|\brsus?\b/i.test(text)) benefits.push("Equity");
  if (/\bremote[-\s]?first\b|\bdistributed team\b/i.test(text)) benefits.push("Remote-first");
  return benefits;
}

function inferVisaSponsorship(text: string): boolean {
  return /\bvisa sponsorship\b|\bsponsorship available\b|\bh-?1b\b|\bwork authorization support\b/i.test(text);
}

function deriveJobMeta(job: RecommendedJobCard): DerivedJobMeta {
  const text = normalizeText(job.title, job.company, job.location, job.description, job.matchLabel);
  const jobTypes = inferJobTypes(text);

  return {
    searchBlob: normalizeText(job.title, job.company, job.location, job.description, job.matchLabel, job.matchedSkills.join(" ")),
    jobTypes,
    primaryJobType: jobTypes[0] ?? null,
    locationMode: inferLocationMode(job.location, job.description),
    experienceLevel: inferExperienceLevel(text),
    salary: inferSalary(text),
    companySize: inferCompanySize(text),
    industries: inferIndustries(text),
    benefits: inferBenefits(text),
    hasVisaSponsorship: inferVisaSponsorship(text),
    isEasyApply: Boolean(job.applyUrl?.trim()),
  };
}

function parseEnumParam<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value && allowed.includes(value as T) ? (value as T) : fallback;
}

function parseCsvSet<T extends string>(value: string | null, allowed: readonly T[]): Set<T> {
  if (!value) return new Set();
  return new Set(value.split(",").filter((item): item is T => allowed.includes(item as T)));
}

function parseStringSet(value: string | null): Set<string> {
  if (!value) return new Set();
  return new Set(
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function parseNumberParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBooleanParam(value: string | null): boolean {
  return value === "1" || value === "true";
}

function searchTermsMatch(blob: string, rawQuery: string): boolean {
  const trimmed = rawQuery.trim().toLowerCase();
  if (!trimmed) return true;
  const terms = trimmed.split(/\s+/).filter((t) => t.length > 0);
  if (terms.length === 0) return true;
  return terms.every((term) => blob.includes(term));
}

const JOB_TYPE_KEYWORDS: Record<JobTypeOption, string[]> = {
  "Full-time": ["full-time", "full time"],
  "Part-time": ["part-time", "part time"],
  Contract: ["contract", "contractor"],
  Freelance: ["freelance", "freelancer"],
  Internship: ["internship", "intern"],
  Temporary: ["temporary", "temp role"],
};

function jobTypeMatches(meta: DerivedJobMeta, selected: Set<JobTypeOption>): boolean {
  if (selected.size === 0) return true;
  if (meta.jobTypes.some((type) => selected.has(type))) return true;
  return [...selected].some((type) =>
    JOB_TYPE_KEYWORDS[type].some((keyword) => meta.searchBlob.includes(keyword))
  );
}

const EXPERIENCE_KEYWORDS: Record<ExperienceFilterOption, string[]> = {
  "Entry (0-2yr)": ["entry level", "entry-level", "junior", "graduate", "new grad", "intern"],
  "Mid (2-5yr)": ["mid level", "mid-level", "intermediate", "2-5 year", "3 years"],
  "Senior (5-8yr)": ["senior", "sr.", "5+ years", "5-8 year"],
  "Lead (8-12yr)": ["lead", "principal", "staff", "8+ years", "manager"],
  "Executive (12yr+)": ["executive", "director", "vp", "head of", "chief"],
};

function experienceMatches(meta: DerivedJobMeta, level: "any" | ExperienceFilterOption): boolean {
  if (level === "any") return true;
  if (meta.experienceLevel === level) return true;
  const keywords = EXPERIENCE_KEYWORDS[level];
  return keywords.some((keyword) => meta.searchBlob.includes(keyword));
}

function locationMatches(
  job: RecommendedJobCard,
  meta: DerivedJobMeta,
  mode: "any" | "remote" | "hybrid" | "onsite",
  locationText: string
): boolean {
  const blob = normalizeText(job.location, job.description, job.title);
  const needle = locationText.trim().toLowerCase();
  if (needle && !blob.includes(needle)) return false;
  if (mode === "any") return true;
  if (meta.locationMode === mode) return true;
  if (mode === "remote") {
    return /\bremote\b|work from home|\bwfh\b|distributed|anywhere|telecommute/.test(blob);
  }
  if (mode === "hybrid") {
    return /\bhybrid\b|partially remote|flexible location/.test(blob);
  }
  if (mode === "onsite") {
    const hasRemoteSignal = /\bremote\b|work from home|\bwfh\b|distributed/.test(blob);
    return (
      /\bon[- ]?site\b|\bin[- ]?office\b/.test(blob) ||
      (!hasRemoteSignal && Boolean(job.location.trim()) && job.location !== "Location TBD")
    );
  }
  return true;
}

function industriesMatch(meta: DerivedJobMeta, selected: Set<IndustryOption>): boolean {
  if (selected.size === 0) return true;
  if (meta.industries.some((industry) => selected.has(industry))) return true;
  return [...selected].some((industry) =>
    INDUSTRY_KEYWORDS[industry].some((keyword) => meta.searchBlob.includes(keyword))
  );
}

type Props = {
  jobs: RecommendedJobCard[];
  skillHints: string[];
  profileHeadline?: string | null;
  profileSummary?: string | null;
  feedKind: "live" | "demo";
  feedDemoHint?: FeedDemoHint | null;
  liveListings?: number;
  matchedListings?: number;
  hasResume?: boolean;
};

function demoBannerCopy(hint: FeedDemoHint): { title: string; body: string } {
  switch (hint) {
    case "empty_table":
      return {
        title: "No job rows in this site’s Supabase database yet",
        body:
          "Vercel reads public.jobs from NEXT_PUBLIC_SUPABASE_URL. Add rows with ATS ingest (GitHub Action or job_aggregator python -m app.main ingest), or run community sync (cron GET /api/sync-community-jobs with CRON_SECRET, or an admin POST) so community listings fill the table. Confirm migrations in supabase/migrations and check /api/jobs-health and /api/community-jobs-health.",
      };
    case "count_unavailable":
    case "rows_unavailable":
      return {
        title: "Could not load listings from Supabase",
        body:
          "Often missing GRANT SELECT on public.jobs, missing RLS policies, or wrong API keys. Run all SQL migrations in supabase/migrations (including 20260205153000_jobs_api_grants.sql), then open /api/jobs-health on this domain to see the exact error.",
      };
    case "select_returned_empty":
      return {
        title: "Job count looks non-zero but no rows were returned",
        body:
          "Rare mismatch (RLS vs count, or stale schema cache). Check /api/jobs-health and confirm migrations; in Supabase Dashboard try Database → Settings → reload if your project offers schema refresh.",
      };
  }
}

function passesDateFilter(iso: string | null | undefined, windowId: "any" | "1" | "7" | "30"): boolean {
  if (windowId === "any") return true;
  if (!iso) return true;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return true;
  const days = Number(windowId);
  const cutoff = Date.now() - days * 86400000;
  return t >= cutoff;
}

function getMatchScore(job: RecommendedJobCard, profile: ProfileMatchInput): number {
  return scoreJobCard(job, profile).matchPercent;
}

const MIN_PROFILE_RELEVANCE_SCORE = 8;

export default function RecommendedJobsSection({
  jobs: initialJobs,
  skillHints,
  profileHeadline = null,
  profileSummary = null,
  feedKind,
  feedDemoHint,
  liveListings = 0,
  matchedListings = 0,
  hasResume = false,
}: Props) {
  const profileMatch = useMemo<ProfileMatchInput>(
    () => ({
      skills: skillHints,
      headline: profileHeadline,
      summary: profileSummary,
    }),
    [skillHints, profileHeadline, profileSummary]
  );
  const profileMatchActive = skillHints.length > 0;
  const isLiveFeed = feedKind === "live" || liveListings > 0;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { userId } = useDashboardContext();
  const isMobile = useMediaQuery("(max-width:767px)");
  const initialDateWindow = parseEnumParam(searchParams.get("date"), DATE_WINDOW_OPTIONS, "any");
  const initialSources = parseCsvSet(searchParams.get("src"), JOB_FEED_SOURCE_OPTIONS);
  const initialSkillsPick = parseStringSet(searchParams.get("skillPick") ?? searchParams.get("skills"));
  const initialMatchScore = parseEnumParam(searchParams.get("match"), MATCH_SCORE_OPTIONS, "any");
  const initialJobTypes = parseCsvSet(searchParams.get("type"), JOB_TYPE_OPTIONS);
  const initialLocationMode = parseEnumParam(searchParams.get("locMode"), LOCATION_MODE_OPTIONS, "any");
  const initialExperienceLevel = parseEnumParam(searchParams.get("exp"), EXPERIENCE_OPTIONS, EXPERIENCE_OPTIONS[0]);
  const hasExperienceParam = searchParams.has("exp");
  const initialSalaryMin = parseNumberParam(searchParams.get("salMin"), 0);
  const initialSalaryMax = parseNumberParam(searchParams.get("salMax"), 500);
  const initialCurrency = parseEnumParam(searchParams.get("ccy"), CURRENCY_OPTIONS, "USD");
  const initialSalaryPeriod = parseEnumParam(searchParams.get("salPeriod"), SALARY_PERIOD_OPTIONS, "year");
  const initialCompanySize = parseEnumParam(searchParams.get("companySize"), COMPANY_SIZE_OPTIONS, COMPANY_SIZE_OPTIONS[0]);
  const hasCompanySizeParam = searchParams.has("companySize");
  const initialIndustries = parseCsvSet(searchParams.get("industry"), INDUSTRY_OPTIONS);
  const initialBenefits = parseCsvSet(searchParams.get("benefits"), BENEFIT_OPTIONS);
  const hint =
    skillHints.length > 0
      ? `Sorted by fit to your resume — skills, headline, and summary matched against each role (${skillHints.slice(0, 4).join(", ")}${skillHints.length > 4 ? "…" : ""}).`
      : "Add skills, headline, and summary on your profile so we can rank roles that fit your background.";

  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const [dateWindow, setDateWindow] = useState<"any" | "1" | "7" | "30">(initialDateWindow);
  const [sources, setSources] = useState<Set<JobFeedSource>>(initialSources);
  const [skillsPick, setSkillsPick] = useState<Set<string>>(initialSkillsPick);
  const initialJobsPage = Math.max(1, parseNumberParam(searchParams.get("jobsPage"), 1));
  const [currentPage, setCurrentPage] = useState(initialJobsPage);
  const [matchScore, setMatchScore] = useState<"any" | "90" | "75" | "60">(initialMatchScore);
  const [jobTypes, setJobTypes] = useState<Set<JobTypeOption>>(initialJobTypes);
  const [locationMode, setLocationMode] = useState<"any" | "remote" | "hybrid" | "onsite">(initialLocationMode);
  const [locationQuery, setLocationQuery] = useState(searchParams.get("loc") ?? "");
  const [experienceLevel, setExperienceLevel] = useState<"any" | ExperienceFilterOption>(
    hasExperienceParam ? initialExperienceLevel : "any"
  );
  const [salaryMin, setSalaryMin] = useState(initialSalaryMin);
  const [salaryMax, setSalaryMax] = useState(initialSalaryMax);
  const [currency, setCurrency] = useState(initialCurrency);
  const [salaryPeriod, setSalaryPeriod] = useState<"year" | "hour">(initialSalaryPeriod);
  const [companySize, setCompanySize] = useState<"any" | CompanySizeFilterOption>(
    hasCompanySizeParam ? initialCompanySize : "any"
  );
  const [industries, setIndustries] = useState<Set<IndustryOption>>(initialIndustries);
  const [industrySearch, setIndustrySearch] = useState("");
  const [requiredSkillsInput, setRequiredSkillsInput] = useState(searchParams.get("reqSkills") ?? "");
  const [companyQuery, setCompanyQuery] = useState(searchParams.get("company") ?? "");
  const [benefits, setBenefits] = useState<Set<BenefitOption>>(initialBenefits);
  const [visaSponsorshipOnly, setVisaSponsorshipOnly] = useState(parseBooleanParam(searchParams.get("visa")));
  const [easyApplyOnly, setEasyApplyOnly] = useState(parseBooleanParam(searchParams.get("easy")));
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [isMatchProfileExpanded, setIsMatchProfileExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">(() =>
    resolveJobsLayoutFromSearchParams(searchParams)
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    parseEnumParam(searchParams.get("sort"), SORT_PARAM_VALUES, "best")
  );
  const [savedJobs, setSavedJobs] = useState<Set<string>>(() => new Set());
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isInitialLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [pageJobs, setPageJobs] = useState<RecommendedJobCard[]>(() => initialJobs.slice(0, PAGE_SIZE));
  const [filterPoolJobs, setFilterPoolJobs] = useState<RecommendedJobCard[]>([]);
  const [apiTotal, setApiTotal] = useState(
    isLiveFeed ? liveListings || initialJobs.length : initialJobs.length
  );
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [mobileDetailJobId, setMobileDetailJobId] = useState<string | null>(null);
  /** When true (e.g. "Matched to your profile" dashboard card), hide jobs with no profile overlap. */
  const [showProfileMatchesOnly, setShowProfileMatchesOnly] = useState(false);
  const deferredSearchInput = useDeferredValue(searchInput);
  const query = searchInput.trim();
  const isSearching = deferredSearchInput !== searchInput;

  useEffect(() => {
    if (!userId) return;
    setSavedJobs(readSavedJobIds(userId));
  }, [userId]);

  const markJobApplied = useCallback(
    async (job: { jobId: string; company: string; title: string; applyUrl: string }) => {
      const res = await fetch("/api/applications", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: job.company,
          role: job.title,
          status: "applied",
          job_url: job.applyUrl,
          applied_date: new Date().toISOString().slice(0, 10),
          notes: `Tracked from job listing (${job.jobId})`,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Failed to track application");
      }
    },
    [],
  );

  const saveJobForLater = useCallback(
    (jobId: string) => {
      if (!userId) return;
      saveJobId(userId, jobId);
      setSavedJobs((prev) => {
        const next = new Set(prev);
        next.add(jobId);
        return next;
      });
    },
    [userId],
  );

  const catalogFilters = useMemo(
    () => ({
      q: query || undefined,
      sources: sources.size > 0 ? [...sources] : undefined,
      dateWindow,
      locationMode,
      locationQuery: locationQuery.trim() || undefined,
      company: companyQuery.trim() || undefined,
      jobTypes: jobTypes.size > 0 ? [...jobTypes] : undefined,
    }),
    [query, sources, dateWindow, locationMode, locationQuery, companyQuery, jobTypes]
  );

  const salaryFilterActive = salaryMin > 0 || salaryMax < 500 || currency !== "USD" || salaryPeriod !== "year";
  const normalizedRequiredSkills = useMemo(
    () =>
      requiredSkillsInput
        .split(",")
        .map((skill) => skill.trim().toLowerCase())
        .filter(Boolean),
    [requiredSkillsInput]
  );

  const clientFilterState = useMemo<JobListingFilterState>(
    () => ({
      q: query,
      dateWindow,
      sources,
      locationMode,
      locationQuery,
      companyQuery,
      jobTypes,
      matchScore,
      skillsPick,
      experienceLevel,
      salaryFilterActive,
      salaryMin,
      salaryMax,
      currency,
      salaryPeriod,
      companySize,
      industries,
      normalizedRequiredSkills,
      benefits,
      visaSponsorshipOnly,
      easyApplyOnly,
    }),
    [
      query,
      dateWindow,
      sources,
      locationMode,
      locationQuery,
      companyQuery,
      jobTypes,
      matchScore,
      skillsPick,
      experienceLevel,
      salaryFilterActive,
      salaryMin,
      salaryMax,
      currency,
      salaryPeriod,
      companySize,
      industries,
      normalizedRequiredSkills,
      benefits,
      visaSponsorshipOnly,
      easyApplyOnly,
    ]
  );

  const userFiltersActive = useMemo(
    () =>
      hasAnyUserJobFilters(catalogFilters, clientFilterState, {
        profileMatchesOnly: showProfileMatchesOnly,
      }),
    [catalogFilters, clientFilterState, showProfileMatchesOnly]
  );

  const useServerJobs = isLiveFeed;
  const needsClientFilterPool =
    useServerJobs &&
    needsJobClientFilterPool(clientFilterState, { profileMatchesOnly: showProfileMatchesOnly });

  const profileOverlapOptions = useMemo(
    () => ({
      profile: profileMatch,
      requireProfileOverlap: showProfileMatchesOnly && profileMatchActive && isLiveFeed,
      minProfileScore: MIN_PROFILE_RELEVANCE_SCORE,
    }),
    [profileMatch, showProfileMatchesOnly, profileMatchActive, isLiveFeed]
  );

  const listingPipeline = useMemo(() => {
    try {
      const sourceJobs = useServerJobs
        ? needsClientFilterPool
          ? filterPoolJobs
          : pageJobs
        : initialJobs;
      const enriched = sourceJobs.map((job) => ({
        job,
        meta: deriveJobMeta(job),
        score: getMatchScore(job, profileMatch),
      }));

      const filtered =
        useServerJobs && !needsClientFilterPool
          ? applyClientOnlyJobListingFilters(enriched, clientFilterState, profileOverlapOptions)
          : applyJobListingFilters(enriched, clientFilterState, profileOverlapOptions);

      const rows = [...filtered];
      rows.sort((a, b) => {
        if (sortBy === "company_asc") return a.job.company.localeCompare(b.job.company);
        if (sortBy === "newest") {
          return (new Date(b.job.postedAtIso || 0).getTime() || 0) - (new Date(a.job.postedAtIso || 0).getTime() || 0);
        }
        if (sortBy === "salary_desc") return (b.meta.salary?.maxK ?? -1) - (a.meta.salary?.maxK ?? -1);
        if (sortBy === "salary_asc") return (a.meta.salary?.minK ?? Number.MAX_SAFE_INTEGER) - (b.meta.salary?.minK ?? Number.MAX_SAFE_INTEGER);
        return b.score - a.score;
      });
      return rows;
    } catch (error) {
      console.error("[RecommendedJobsSection] listing filter pipeline failed:", error);
      return [];
    }
  }, [
    useServerJobs,
    needsClientFilterPool,
    filterPoolJobs,
    feedKind,
    initialJobs,
    pageJobs,
    profileMatch,
    clientFilterState,
    profileOverlapOptions,
    sortBy,
  ]);

  const visibleJobs = useMemo(() => {
    if (useServerJobs && !needsClientFilterPool) return listingPipeline;
    const start = (currentPage - 1) * PAGE_SIZE;
    return listingPipeline.slice(start, start + PAGE_SIZE);
  }, [useServerJobs, needsClientFilterPool, listingPipeline, currentPage]);

  const totalMatched = useServerJobs
    ? needsClientFilterPool
      ? listingPipeline.length
      : apiTotal
    : listingPipeline.length;

  const platformsInFeed = useMemo(() => {
    const u = new Set<JobFeedSource>();
    for (const { job } of listingPipeline) u.add(job.source);
    return Array.from(u).sort();
  }, [listingPipeline]);

  const sourceFilterOptions = useMemo(() => {
    if (platformsInFeed.length > 0) return platformsInFeed;
    if (isLiveFeed) return [...JOB_FEED_SOURCE_OPTIONS];
    return platformsInFeed;
  }, [platformsInFeed, isLiveFeed]);

  const visibleIndustryOptions = useMemo(
    () =>
      INDUSTRY_OPTIONS.filter((industry) =>
        industry.toLowerCase().includes(industrySearch.trim().toLowerCase())
      ),
    [industrySearch]
  );
  const totalPages = Math.max(1, Math.ceil(totalMatched / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const rangeStart = visibleJobs.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = visibleJobs.length === 0 ? 0 : rangeStart + visibleJobs.length - 1;
  const paginationTokens = useMemo(
    () => buildPaginationTokens(safePage, totalPages),
    [safePage, totalPages]
  );

  const goToPage = useCallback((page: number) => {
    const next = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [totalPages]);

  const buildJobsFetchQuery = useCallback(
    (page: number, batchSize = PAGE_SIZE) => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(batchSize));
      // Paginate the full Postgres catalog; profile match sorting runs client-side.
      params.set("rank_profile", "0");

      if (skillHints.length > 0) {
        params.set("profile_skills", skillHints.join(","));
      }
      if (profileHeadline?.trim()) params.set("profile_headline", profileHeadline.trim());
      if (profileSummary?.trim()) params.set("profile_summary", profileSummary.trim().slice(0, 2000));

      if (catalogFilters.q) params.set("q", catalogFilters.q);
      if (catalogFilters.sources && catalogFilters.sources.length > 0) {
        params.set("src", catalogFilters.sources.join(","));
      }
      if (catalogFilters.dateWindow && catalogFilters.dateWindow !== "any") {
        params.set("date", catalogFilters.dateWindow);
      }
      if (catalogFilters.locationMode && catalogFilters.locationMode !== "any") {
        params.set("locMode", catalogFilters.locationMode);
      }
      if (catalogFilters.locationQuery) params.set("loc", catalogFilters.locationQuery);
      if (catalogFilters.company) params.set("company", catalogFilters.company);
      if (catalogFilters.jobTypes && catalogFilters.jobTypes.length > 0) {
        params.set("type", catalogFilters.jobTypes.join(","));
      }

      return params.toString();
    },
    [skillHints, profileHeadline, profileSummary, catalogFilters]
  );

  const serverCatalogFilters = useMemo(
    () => ({
      q: catalogFilters.q,
      sources: catalogFilters.sources,
      dateWindow: catalogFilters.dateWindow,
      locationMode: catalogFilters.locationMode,
      locationQuery: catalogFilters.locationQuery,
      company: catalogFilters.company,
      jobTypes: catalogFilters.jobTypes,
    }),
    [catalogFilters]
  );

  useEffect(() => {
    if (!useServerJobs) return;

    const controller = new AbortController();
    const fetchPage = needsClientFilterPool ? 1 : currentPage;
    const fetchSize = needsClientFilterPool ? LIVE_JOBS_CLIENT_FILTER_CAP : PAGE_SIZE;

    void (async () => {
      setIsPageLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(`/api/jobs?${buildJobsFetchQuery(fetchPage, fetchSize)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await res.json()) as {
          ok?: boolean;
          jobs?: RecommendedJobCard[];
          total?: number;
        };
        if (controller.signal.aborted) return;
        if (res.ok && payload.ok && payload.jobs) {
          if (needsClientFilterPool) {
            setFilterPoolJobs(payload.jobs);
            setApiTotal(payload.total ?? payload.jobs.length);
          } else {
            setPageJobs(payload.jobs);
            setApiTotal(payload.total ?? payload.jobs.length);
          }
          return;
        }

        const { createBrowserSupabaseClient } = await import("@/lib/supabase");
        const { loadLiveJobCardsPage } = await import("@/lib/jobs-catalog");
        const supabase = createBrowserSupabaseClient();
        const fallback = await loadLiveJobCardsPage(supabase, skillHints, {
          page: fetchPage,
          pageSize: fetchSize,
          rankByProfile: false,
          profile: profileMatch,
          filters: serverCatalogFilters,
        });
        if (controller.signal.aborted) return;
        if (fallback.jobs) {
          if (needsClientFilterPool) {
            setFilterPoolJobs(fallback.jobs);
          } else {
            setPageJobs(fallback.jobs);
          }
          setApiTotal(fallback.total);
          return;
        }
        setFetchError("Could not load jobs for this page.");
      } catch {
        if (!controller.signal.aborted) {
          setFetchError("Network error while loading jobs.");
        }
      } finally {
        if (!controller.signal.aborted) setIsPageLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [
    useServerJobs,
    needsClientFilterPool,
    currentPage,
    buildJobsFetchQuery,
    skillHints,
    profileMatch,
    serverCatalogFilters,
  ]);

  function togglePlatform(src: JobFeedSource) {
    setSources((prev) => {
      const next = new Set(prev);
      if (next.has(src)) {
        next.delete(src);
      } else {
        next.add(src);
      }
      return next;
    });
    setCurrentPage(1);
  }

  const clearFilters = useCallback(() => {
    setShowProfileMatchesOnly(false);
    setSearchInput("");
    setDateWindow("any");
    setSources(new Set());
    setSkillsPick(new Set());
    setMatchScore("any");
    setJobTypes(new Set());
    setLocationMode("any");
    setLocationQuery("");
    setExperienceLevel("any");
    setSalaryMin(0);
    setSalaryMax(500);
    setCurrency("USD");
    setSalaryPeriod("year");
    setCompanySize("any");
    setIndustries(new Set());
    setIndustrySearch("");
    setRequiredSkillsInput("");
    setCompanyQuery("");
    setBenefits(new Set());
    setVisaSponsorshipOnly(false);
    setEasyApplyOnly(false);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const setListParam = (key: string, values: Iterable<string>) => {
        const list = Array.from(values).filter(Boolean).sort();
        if (list.length > 0) params.set(key, list.join(","));
        else params.delete(key);
      };

      if (searchInput.trim()) params.set("q", searchInput.trim());
      else params.delete("q");
      if (dateWindow !== "any") params.set("date", dateWindow);
      else params.delete("date");
      setListParam("src", sources);
      setListParam("skillPick", skillsPick);
      params.delete("skills");
      if (matchScore !== "any") params.set("match", matchScore);
      else params.delete("match");
      setListParam("type", jobTypes);
      if (locationMode !== "any") params.set("locMode", locationMode);
      else params.delete("locMode");
      if (locationQuery.trim()) params.set("loc", locationQuery.trim());
      else params.delete("loc");
      if (experienceLevel !== "any") params.set("exp", experienceLevel);
      else params.delete("exp");
      if (salaryMin > 0) params.set("salMin", String(salaryMin));
      else params.delete("salMin");
      if (salaryMax < 500) params.set("salMax", String(salaryMax));
      else params.delete("salMax");
      if (currency !== "USD") params.set("ccy", currency);
      else params.delete("ccy");
      if (salaryPeriod !== "year") params.set("salPeriod", salaryPeriod);
      else params.delete("salPeriod");
      if (companySize !== "any") params.set("companySize", companySize);
      else params.delete("companySize");
      setListParam("industry", industries);
      if (requiredSkillsInput.trim()) params.set("reqSkills", requiredSkillsInput.trim());
      else params.delete("reqSkills");
      if (companyQuery.trim()) params.set("company", companyQuery.trim());
      else params.delete("company");
      setListParam("benefits", benefits);
      if (visaSponsorshipOnly) params.set("visa", "1");
      else params.delete("visa");
      if (easyApplyOnly) params.set("easy", "1");
      else params.delete("easy");
      const dashboardView = resolveDashboardRouteFromSearchParams(searchParams);
      params.set("view", dashboardView);
      if (viewMode !== "list") params.set("jobsLayout", viewMode);
      else params.delete("jobsLayout");
      if (sortBy !== "best") params.set("sort", sortBy);
      else params.delete("sort");
      if (currentPage > 1) params.set("jobsPage", String(currentPage));
      else params.delete("jobsPage");
      const nextQuery = params.toString();
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) return;
      const next = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      router.replace(next, { scroll: false });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [
    searchInput,
    dateWindow,
    sources,
    skillsPick,
    matchScore,
    jobTypes,
    locationMode,
    locationQuery,
    experienceLevel,
    salaryMin,
    salaryMax,
    currency,
    salaryPeriod,
    companySize,
    industries,
    requiredSkillsInput,
    companyQuery,
    benefits,
    visaSponsorshipOnly,
    easyApplyOnly,
    viewMode,
    sortBy,
    currentPage,
    pathname,
    router,
    searchParams,
  ]);

  useEffect(() => {
    const closeAllDropdowns = () => {
      document.querySelectorAll<HTMLDetailsElement>('details[data-filter-dropdown="true"]').forEach((el) => {
        el.open = false;
      });
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const insideDropdown = (target as Element).closest('details[data-filter-dropdown="true"]');
      if (!insideDropdown) closeAllDropdowns();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAllDropdowns();
        setIsMoreFiltersOpen(false);
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const active = document.activeElement as HTMLElement | null;
      if (!active) return;
      const menu = active.closest("[data-filter-menu='true']") as HTMLElement | null;
      if (!menu) return;
      const focusables = Array.from(
        menu.querySelectorAll<HTMLElement>("button,input,select,[tabindex]:not([tabindex='-1'])")
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusables.length === 0) return;
      const currentIndex = focusables.indexOf(active);
      const nextIndex =
        event.key === "ArrowDown"
          ? (currentIndex + 1 + focusables.length) % focusables.length
          : (currentIndex - 1 + focusables.length) % focusables.length;
      focusables[nextIndex]?.focus();
      event.preventDefault();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const filterResetKey = useMemo(
    () =>
      JSON.stringify({
        q: query,
        dateWindow,
        sources: [...sources].sort(),
        locationMode,
        locationQuery: locationQuery.trim(),
        companyQuery: companyQuery.trim(),
        jobTypes: [...jobTypes].sort(),
        matchScore,
        skillsPick: [...skillsPick].sort(),
        experienceLevel,
        salaryFilterActive,
        companySize,
        industries: [...industries].sort(),
        benefits: [...benefits].sort(),
        visaSponsorshipOnly,
        easyApplyOnly,
        showProfileMatchesOnly,
        requiredSkills: normalizedRequiredSkills.join(","),
        salaryMin,
        salaryMax,
        currency,
        salaryPeriod,
      }),
    [
      query,
      dateWindow,
      sources,
      locationMode,
      locationQuery,
      companyQuery,
      jobTypes,
      matchScore,
      skillsPick,
      experienceLevel,
      salaryFilterActive,
      companySize,
      industries,
      benefits,
      visaSponsorshipOnly,
      easyApplyOnly,
      showProfileMatchesOnly,
      normalizedRequiredSkills,
      salaryMin,
      salaryMax,
      currency,
      salaryPeriod,
    ]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterResetKey, sortBy]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const skeletonCount = viewMode === "grid" ? 6 : 3;
  const showSkeleton = (isInitialLoading || isPageLoading) && listingPipeline.length === 0 && visibleJobs.length === 0;
  const showPageLoadingOverlay = isPageLoading && visibleJobs.length > 0;
  const shouldVirtualize = false;

  useEffect(() => {
    const handler = (event: Event) => {
      const ce = event as CustomEvent<{ filter?: "all" | "matched" | "applied" | "saved" }>;
      const filter = ce.detail?.filter;
      if (!filter) return;
      if (filter === "all") {
        setShowProfileMatchesOnly(false);
        clearFilters();
        return;
      }
      if (filter === "matched") {
        setShowProfileMatchesOnly(true);
        setSearchInput("");
        setDateWindow("any");
        setSources(new Set());
        setSkillsPick(new Set());
        setCurrentPage(1);
        return;
      }
      // Applied/saved cards currently route users into the jobs list view.
      // Dedicated per-job status filtering will be wired when tracker status is attached to each row.
      setSearchInput("");
      setDateWindow("any");
      setSources(new Set());
      setSkillsPick(new Set());
      setCurrentPage(1);
    };
    window.addEventListener("wg:job-filter", handler as EventListener);
    return () => window.removeEventListener("wg:job-filter", handler as EventListener);
  }, [clearFilters, skillHints]);

  useEffect(() => {
    const handler = (event: Event) => {
      const ce = event as CustomEvent<{ source?: string | null }>;
      if (!ce.detail) return;
      const source = ce.detail.source;
      setCurrentPage(1);
      if (!source) {
        setSources(new Set());
        return;
      }
      setSources(new Set([source as JobFeedSource]));
    };
    window.addEventListener("wg:job-source-filter", handler as EventListener);
    return () => window.removeEventListener("wg:job-source-filter", handler as EventListener);
  }, []);

  const hasActiveFilters =
    query.trim() !== "" ||
    dateWindow !== "any" ||
    sources.size > 0 ||
    skillsPick.size > 0 ||
    matchScore !== "any" ||
    jobTypes.size > 0 ||
    locationMode !== "any" ||
    locationQuery.trim() !== "" ||
    experienceLevel !== "any" ||
    salaryFilterActive ||
    companySize !== "any" ||
    industries.size > 0 ||
    normalizedRequiredSkills.length > 0 ||
    companyQuery.trim() !== "" ||
    benefits.size > 0 ||
    visaSponsorshipOnly ||
    easyApplyOnly;
  const activeFilterCount =
    (query.trim() ? 1 : 0) +
    (dateWindow !== "any" ? 1 : 0) +
    (sources.size > 0 ? 1 : 0) +
    (skillsPick.size > 0 ? 1 : 0) +
    (matchScore !== "any" ? 1 : 0) +
    (jobTypes.size > 0 ? 1 : 0) +
    (locationMode !== "any" || locationQuery.trim() ? 1 : 0) +
    (experienceLevel !== "any" ? 1 : 0) +
    (salaryFilterActive ? 1 : 0) +
    (companySize !== "any" ? 1 : 0) +
    (industries.size > 0 ? 1 : 0) +
    (normalizedRequiredSkills.length > 0 ? 1 : 0) +
    (companyQuery.trim() ? 1 : 0) +
    (benefits.size > 0 ? 1 : 0) +
    (visaSponsorshipOnly ? 1 : 0) +
    (easyApplyOnly ? 1 : 0);

  const advancedFilterCount =
    (sources.size > 0 ? 1 : 0) +
    (skillsPick.size > 0 ? 1 : 0) +
    (matchScore !== "any" ? 1 : 0) +
    (experienceLevel !== "any" ? 1 : 0) +
    (salaryFilterActive ? 1 : 0) +
    (companySize !== "any" ? 1 : 0) +
    (industries.size > 0 ? 1 : 0) +
    (normalizedRequiredSkills.length > 0 ? 1 : 0) +
    (companyQuery.trim() ? 1 : 0) +
    (benefits.size > 0 ? 1 : 0) +
    (visaSponsorshipOnly ? 1 : 0) +
    (easyApplyOnly ? 1 : 0);

  const activeFilterChips = [
    query.trim() ? { key: "query", label: `Search: ${query.trim()}` } : null,
    matchScore !== "any" ? { key: "match", label: `Match ${matchScore}%+` } : null,
    dateWindow !== "any" ? { key: "date", label: `Date: ${DATE_OPTIONS.find((d) => d.id === dateWindow)?.label}` } : null,
    sources.size > 0 ? { key: "source", label: `Source: ${Array.from(sources).map((src) => SOURCE_STYLES[src].label).join(", ")}` } : null,
    jobTypes.size > 0 ? { key: "jobType", label: `Job Type: ${Array.from(jobTypes).join(", ")}` } : null,
    (locationMode !== "any" || locationQuery.trim())
      ? { key: "location", label: `Location: ${formatLocationFilterLabel(locationMode, locationQuery)}` }
      : null,
    experienceLevel !== "any" ? { key: "exp", label: `Experience: ${experienceLevel}` } : null,
    salaryFilterActive ? { key: "salary", label: `Salary: ${currency} ${salaryMin}K-${salaryMax}K${salaryPeriod === "hour" ? "/hr" : ""}` } : null,
    companySize !== "any" ? { key: "size", label: `Size: ${companySize}` } : null,
    industries.size > 0 ? { key: "industry", label: `Industry: ${industries.size}` } : null,
    normalizedRequiredSkills.length > 0 ? { key: "requiredSkills", label: `Skills: ${normalizedRequiredSkills.join(", ")}` } : null,
    companyQuery.trim() ? { key: "company", label: `Company: ${companyQuery.trim()}` } : null,
    benefits.size > 0 ? { key: "benefits", label: `Benefits: ${benefits.size}` } : null,
    visaSponsorshipOnly ? { key: "visa", label: "Visa sponsorship" } : null,
    easyApplyOnly ? { key: "easyApply", label: "Easy Apply" } : null,
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  function removeChip(key: string) {
    if (key === "query") {
      setSearchInput("");
    } else if (key === "match") setMatchScore("any");
    else if (key === "date") setDateWindow("any");
    else if (key === "source") setSources(new Set());
    else if (key === "jobType") setJobTypes(new Set());
    else if (key === "location") {
      setLocationMode("any");
      setLocationQuery("");
    } else if (key === "exp") setExperienceLevel("any");
    else if (key === "salary") {
      setSalaryMin(0);
      setSalaryMax(500);
      setCurrency("USD");
      setSalaryPeriod("year");
    }
    else if (key === "size") setCompanySize("any");
    else if (key === "industry") setIndustries(new Set());
    else if (key === "requiredSkills") setRequiredSkillsInput("");
    else if (key === "company") setCompanyQuery("");
    else if (key === "benefits") setBenefits(new Set());
    else if (key === "visa") setVisaSponsorshipOnly(false);
    else if (key === "easyApply") setEasyApplyOnly(false);
    setCurrentPage(1);
  }

  const matchBreakdown = useMemo(() => {
    if (skillHints.length === 0) return [];
    return skillHints.slice(0, 6).map((skill) => ({
      label: skill,
      score: 100,
      color: "#1A73E8",
      detail: "Listed on your profile",
    }));
  }, [skillHints]);

  return (
    <section id="recommended-jobs" className="scroll-mt-28">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4 wg-section-fade" style={{ animationDelay: "0ms" }}>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8E8E93]">Job board</p>
          <h2 className="mt-1 text-[18px] font-semibold text-[#2C2C2E] sm:text-[18px]">
            {isLiveFeed
              ? profileMatchActive
                ? "Jobs matching your profile"
                : "Browse live job listings"
              : "No live jobs indexed yet"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-normal leading-relaxed text-[#3A3A3C]">{hint}</p>
        </div>
        <span
          className={`rounded-[20px] px-3 py-1 text-xs font-medium uppercase tracking-wide ring-1 ${
            isLiveFeed
              ? "border-0 bg-[#E8F0FE] text-[#1557B0] ring-[#DADCE0]"
              : "border-[#DADCE0] bg-[#FEF7E0] text-[#5F6368] ring-[#DADCE0]"
          }`}
        >
          {isLiveFeed ? "Live feed" : "No data"}
        </span>
      </div>

      {!isLiveFeed && feedDemoHint ? (
        <div className="mb-3 flex gap-3 rounded-xl border border-[#DADCE0] bg-[#FEF7E0] p-4 text-sm text-[#3A3A3C] ring-1 ring-[#DADCE0] wg-section-fade" style={{ animationDelay: "100ms" }}>
          <span className="mt-0.5 shrink-0 text-amber-700">
            <LifeBuoy className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 space-y-2">
            <p className="font-semibold leading-snug text-amber-950">{demoBannerCopy(feedDemoHint).title}</p>
            <p className="leading-relaxed text-amber-900/95">{demoBannerCopy(feedDemoHint).body}</p>
            <p className="text-xs text-amber-800/90">
              <Link
                href="/api/jobs-health"
                className="font-medium underline decoration-[#F9AB00] underline-offset-2 hover:text-[#1D1D1F]"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open /api/jobs-health
              </Link>{" "}
              (new tab) — then compare Supabase project ref with Vercel env and GitHub Action secrets.
            </p>
          </div>
        </div>
      ) : null}

      <section className="mb-3 rounded-xl border border-[#DADCE0] bg-white px-6 py-5 lg:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#1D1D1F]">Your Match Profile</h3>
            <p className="mt-1 text-[13px] text-[#8E8E93]">Based on your profile, we match jobs by:</p>
          </div>
          <button
            type="button"
            onClick={() => setIsMatchProfileExpanded((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#DADCE0] text-[#5F6368]"
            aria-label={isMatchProfileExpanded ? "Collapse profile analysis" : "Expand profile analysis"}
          >
            {isMatchProfileExpanded ? <ChevronUp className={iconClass()} /> : <ChevronDown className={iconClass()} />}
          </button>
        </div>

        {isMatchProfileExpanded && matchBreakdown.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {matchBreakdown.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center rounded-full border border-[#DADCE0] bg-[#F8F9FA] px-3 py-1 text-xs font-medium text-[#3A3A3C]"
              >
                {item.label}
              </span>
            ))}
            <Link href="/profile?view=profile" className="text-[13px] font-medium text-[#1A73E8] hover:underline">
              Update profile skills
            </Link>
          </div>
        ) : isMatchProfileExpanded ? (
          <p className="mt-4 text-sm text-[#8E8E93]">
            Add skills to your profile to enable job matching.{" "}
            <Link href="/profile?view=profile" className="font-medium text-[#1A73E8] hover:underline">
              Edit profile
            </Link>
          </p>
        ) : null}
      </section>

      {fetchError ? (
        <div className="mb-3 rounded-xl border border-[#FAD2CF] bg-[#FCE8E6] p-4 text-sm text-[#3A3A3C]">
          <p className="font-semibold text-[#C5221F]">Could not load more jobs</p>
          <p className="mt-1 text-[#5F6368]">{fetchError}</p>
        </div>
      ) : null}

      {liveListings > 0 ? (
        <p className="mb-3 text-sm text-[#5F6368]">
          {showProfileMatchesOnly ? (
            <>
              <span className="font-semibold text-[#1A73E8]">{totalMatched.toLocaleString()}</span> jobs match your
              profile
              {liveListings > totalMatched ? ` · ${liveListings.toLocaleString()} indexed in Postgres` : ""}.
            </>
          ) : (
            <>
              <span className="font-semibold text-[#1A73E8]">{totalMatched.toLocaleString()}</span> jobs in catalog
              {liveListings > totalMatched ? ` · ${liveListings.toLocaleString()} indexed in Postgres` : ""} — ranked by
              profile fit when skills are set.
            </>
          )}{" "}
          Browse by page below.
        </p>
      ) : null}

      {(initialJobs.length > 0 || isLiveFeed) ? (
        <>
          <div className="mb-2 md:hidden">
            <Button
              type="button"
              onClick={() => setIsMobileFiltersOpen(true)}
              variant="outline"
              className="rounded-full"
              aria-label="Open filters panel"
            >
              <SlidersHorizontal className={iconClass()} />
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Button>
          </div>

          <section className="filter-bar wg-no-scrollbar -mx-4 hidden sm:-mx-6 md:block md:-mx-8">
            <div className="filter-search-wrap">
              <Search className="filter-search-icon text-[#94a3b8]" aria-hidden />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search job titles, companies..."
                className="filter-search"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className={iconClass()} />
                </button>
              ) : null}
              {isSearching ? (
                <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-slate-400" />
              ) : null}
            </div>

            <details data-filter-dropdown="true" className="relative shrink-0">
              <summary className={cn("filter-dropdown-btn", jobTypes.size > 0 && "active")}>
                {jobTypes.size > 0 ? `Job Type · ${jobTypes.size}` : "Job Type"}
                <ChevronDown className={iconClass("inline")} aria-hidden />
              </summary>
              <div data-filter-menu="true" className="filter-menu w-52">
                {JOB_TYPE_OPTIONS.map((type) => (
                  <label key={type} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={jobTypes.has(type)}
                      onChange={() => {
                        setJobTypes((prev) => {
                          const next = new Set(prev);
                          if (next.has(type)) next.delete(type);
                          else next.add(type);
                          return next;
                        });
                        setCurrentPage(1);
                      }}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </details>

            <details data-filter-dropdown="true" className="relative shrink-0">
              <summary
                className={cn(
                  "filter-dropdown-btn",
                  (locationMode !== "any" || locationQuery.trim()) && "active",
                )}
              >
                Location
                <ChevronDown className={iconClass("inline")} aria-hidden />
              </summary>
              <div data-filter-menu="true" className="filter-menu filter-menu--wide">
                <input
                  value={locationQuery}
                  onChange={(e) => {
                    setLocationQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Country or city"
                  className="mb-2 h-9 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
                <div className="flex flex-wrap gap-2">
                  {["any", "remote", "hybrid", "onsite"].map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        setLocationMode(loc as "any" | "remote" | "hybrid" | "onsite");
                        setCurrentPage(1);
                      }}
                      className={cn(
                        "filter-location-pill",
                        locationMode === loc && "active",
                      )}
                    >
                      {loc === "any" ? "Any" : loc === "onsite" ? "On-site" : loc[0].toUpperCase() + loc.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </details>

            <details data-filter-dropdown="true" className="relative shrink-0">
              <summary className={cn("filter-dropdown-btn", dateWindow !== "any" && "active")}>
                Date posted
                <ChevronDown className={iconClass("inline")} aria-hidden />
              </summary>
              <div data-filter-menu="true" className="filter-menu w-48">
                {DATE_OPTIONS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setDateWindow(d.id);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "results-bar__sort-option",
                      dateWindow === d.id && "active",
                    )}
                  >
                    {d.label}
                    {dateWindow === d.id ? <Check className={iconClass()} aria-hidden /> : null}
                  </button>
                ))}
              </div>
            </details>

            <button
              type="button"
              onClick={() => setIsMoreFiltersOpen(true)}
              className={cn("filter-dropdown-btn", advancedFilterCount > 0 && "active")}
            >
              Filters{advancedFilterCount > 0 ? ` (${advancedFilterCount})` : ""}
              <ChevronDown className={iconClass("inline")} aria-hidden />
            </button>
          </section>

          {query.trim() && !isSearching && !isPageLoading && userFiltersActive && listingPipeline.length === 0 ? (
            <p className="-mx-4 hidden border-b border-slate-50 px-5 py-2 text-xs text-slate-400 sm:-mx-6 md:block md:-mx-8">
              No results for &quot;{query.trim()}&quot;.
            </p>
          ) : null}

          {hasActiveFilters ? (
            <div className="filter-tags-bar -mx-4 sm:-mx-6 md:-mx-8">
              {activeFilterChips.map((chip) => (
                <span key={chip.key} className="filter-tag wg-chip-enter">
                  {chip.label}
                  <button
                    type="button"
                    onClick={() => removeChip(chip.key)}
                    className="filter-tag__remove"
                    aria-label={`Remove ${chip.label}`}
                  >
                    <X className={iconClass()} />
                  </button>
                </span>
              ))}
              <button type="button" onClick={clearFilters} className="filter-tags-clear">
                Clear all
              </button>
            </div>
          ) : null}
          <p className="sr-only" aria-live="polite">
            {activeFilterCount === 0 ? "No active filters." : `${activeFilterCount} active filters applied.`}
          </p>
        </>
      ) : null}

      <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
        <SheetContent side="bottom" className="md:hidden">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="grid gap-4 px-1 pb-4 max-h-[70vh] overflow-y-auto">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search job titles, companies..."
            />
            <div className="grid grid-cols-2 gap-2">
              {DATE_OPTIONS.map((d) => (
                <Button
                  key={d.id}
                  type="button"
                  variant={dateWindow === d.id ? "default" : "outline"}
                  onClick={() => setDateWindow(d.id)}
                  className="rounded-2xl"
                >
                  {d.label}
                </Button>
              ))}
            </div>
            <div className="grid gap-2">
              <Label>Location</Label>
              <Input value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} placeholder="City or country" />
              <div className="flex flex-wrap gap-2">
                {LOCATION_MODE_OPTIONS.filter((loc) => loc !== "any").map((loc) => (
                  <Button
                    key={loc}
                    type="button"
                    size="sm"
                    variant={locationMode === loc ? "default" : "outline"}
                    onClick={() => setLocationMode(loc)}
                    className="rounded-2xl capitalize"
                  >
                    {loc === "onsite" ? "On-site" : loc}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Job type</Label>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPE_OPTIONS.map((type) => (
                  <Badge
                    key={type}
                    variant={jobTypes.has(type) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() =>
                      setJobTypes((prev) => {
                        const next = new Set(prev);
                        if (next.has(type)) next.delete(type);
                        else next.add(type);
                        return next;
                      })
                    }
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Source</Label>
              <div className="flex flex-wrap gap-2">
                {(sourceFilterOptions.length > 0 ? sourceFilterOptions : [...JOB_FEED_SOURCE_OPTIONS]).map((src) => (
                  <Badge
                    key={src}
                    variant={sources.has(src) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => togglePlatform(src)}
                  >
                    {SOURCE_STYLES[src].label}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Match score</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "any", label: "Any" },
                  { id: "90", label: "90%+" },
                  { id: "75", label: "75%+" },
                  { id: "60", label: "60%+" },
                ].map((o) => (
                  <Button
                    key={o.id}
                    type="button"
                    variant={matchScore === o.id ? "default" : "outline"}
                    onClick={() => setMatchScore(o.id as typeof matchScore)}
                    className="rounded-2xl"
                  >
                    {o.label}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                clearFilters();
                setIsMobileFiltersOpen(false);
              }}
            >
              Clear all filters
            </Button>
            <Button
              type="button"
              onClick={() => {
                setCurrentPage(1);
                setIsMobileFiltersOpen(false);
              }}
            >
              Apply filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isMoreFiltersOpen} onOpenChange={setIsMoreFiltersOpen}>
        <SheetContent side={isMobile ? "bottom" : "right"} className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Advanced filters</SheetTitle>
          </SheetHeader>
          <div className="grid gap-5 px-1 pb-6">
            <div className="grid gap-2">
              <Label>Match score</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "any", label: "Any" },
                  { id: "90", label: "90%+" },
                  { id: "75", label: "75%+" },
                  { id: "60", label: "60%+" },
                ].map((o) => (
                  <Button
                    key={o.id}
                    type="button"
                    size="sm"
                    variant={matchScore === o.id ? "default" : "outline"}
                    className="rounded-2xl"
                    onClick={() => setMatchScore(o.id as typeof matchScore)}
                  >
                    {o.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Experience</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={experienceLevel === "any" ? "default" : "outline"}
                  className="rounded-2xl"
                  onClick={() => setExperienceLevel("any")}
                >
                  Any
                </Button>
                {EXPERIENCE_OPTIONS.map((exp) => (
                  <Button
                    key={exp}
                    type="button"
                    size="sm"
                    variant={experienceLevel === exp ? "default" : "outline"}
                    className="rounded-2xl"
                    onClick={() => setExperienceLevel(exp)}
                  >
                    {exp}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company-filter">Company</Label>
              <Input
                id="company-filter"
                placeholder="Search company..."
                value={companyQuery}
                onChange={(e) => setCompanyQuery(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Source</Label>
              <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">
                {sourceFilterOptions.map((src) => (
                  <Badge
                    key={src}
                    variant={sources.has(src) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => togglePlatform(src)}
                  >
                    {SOURCE_STYLES[src].label}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Salary range (K)</Label>
              <div className="flex gap-2">
                <Input type="number" value={salaryMin} onChange={(e) => setSalaryMin(Number(e.target.value || 0))} />
                <Input type="number" value={salaryMax} onChange={(e) => setSalaryMax(Number(e.target.value || 500))} />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as (typeof CURRENCY_OPTIONS)[number])}
                  className="h-9 rounded-lg border border-[#DADCE0] px-2 text-sm"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <Button type="button" size="sm" variant={salaryPeriod === "year" ? "default" : "outline"} onClick={() => setSalaryPeriod("year")}>
                  Per year
                </Button>
                <Button type="button" size="sm" variant={salaryPeriod === "hour" ? "default" : "outline"} onClick={() => setSalaryPeriod("hour")}>
                  Per hour
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Company size</Label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant={companySize === "any" ? "default" : "outline"} onClick={() => setCompanySize("any")}>
                  Any
                </Button>
                {COMPANY_SIZE_OPTIONS.map((size) => (
                  <Button
                    key={size}
                    type="button"
                    size="sm"
                    variant={companySize === size ? "default" : "outline"}
                    className="rounded-2xl"
                    onClick={() => setCompanySize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Industry</Label>
              <Input value={industrySearch} onChange={(e) => setIndustrySearch(e.target.value)} placeholder="Search industry..." />
              <div className="flex flex-wrap gap-2">
                {visibleIndustryOptions.map((ind) => (
                  <Badge
                    key={ind}
                    variant={industries.has(ind) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() =>
                      setIndustries((prev) => {
                        const next = new Set(prev);
                        if (next.has(ind)) next.delete(ind);
                        else next.add(ind);
                        return next;
                      })
                    }
                  >
                    {ind}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="req-skills">Skills required in posting</Label>
              <Input
                id="req-skills"
                placeholder="React, Python, SQL"
                value={requiredSkillsInput}
                onChange={(e) => setRequiredSkillsInput(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Benefits</Label>
              <div className="flex flex-wrap gap-2">
                {BENEFIT_OPTIONS.map((benefit) => (
                  <Badge
                    key={benefit}
                    variant={benefits.has(benefit) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() =>
                      setBenefits((prev) => {
                        const next = new Set(prev);
                        if (next.has(benefit)) next.delete(benefit);
                        else next.add(benefit);
                        return next;
                      })
                    }
                  >
                    {benefit}
                  </Badge>
                ))}
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={visaSponsorshipOnly} onCheckedChange={(c) => setVisaSponsorshipOnly(c === true)} />
              Visa sponsorship
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={easyApplyOnly} onCheckedChange={(c) => setEasyApplyOnly(c === true)} />
              Easy apply only
            </label>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={clearFilters}>
                Clear all
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => {
                  setCurrentPage(1);
                  setIsMoreFiltersOpen(false);
                }}
              >
                Apply filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {(listingPipeline.length > 0 || isPageLoading || userFiltersActive || liveListings > 0) ? (
        <div className="results-bar -mx-4 sm:-mx-6 md:-mx-8">
          <div className="results-bar__meta" aria-live="polite">
            <span className="results-bar__count">{totalMatched.toLocaleString()} jobs</span>
            <span aria-hidden>·</span>
            <details data-filter-dropdown="true" className="relative">
              <summary className="results-bar__sort">
                Sorted by {SORT_OPTIONS.find((option) => option.id === sortBy)?.label ?? "Best Match"}
                <ChevronDown className={iconClass()} aria-hidden />
              </summary>
              <div data-filter-menu="true" className="results-bar__sort-menu">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSortBy(option.id)}
                    className={cn("results-bar__sort-option", sortBy === option.id && "active")}
                  >
                    {option.label}
                    {sortBy === option.id ? <Check className={iconClass()} aria-hidden /> : null}
                  </button>
                ))}
              </div>
            </details>
            {isPageLoading ? (
              <Loader2 className={iconClass("inline", "animate-spin text-slate-400")} aria-label="Loading jobs" />
            ) : null}
          </div>
          <div className="view-toggle" role="group" aria-label="Choose jobs list view">
            <button
              type="button"
              className={cn("view-toggle__btn", viewMode === "list" && "active")}
              onClick={() => setViewMode("list")}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <LayoutList className={iconClass("inline")} />
            </button>
            <button
              type="button"
              className={cn("view-toggle__btn", viewMode === "grid" && "active")}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGrid className={iconClass("inline")} />
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
      <div className="jobs-main-content min-w-0">
      {showSkeleton ? (
        <div className={viewMode === "grid" ? "grid gap-1.5 md:grid-cols-2 xl:grid-cols-3" : "job-list"}>
          {Array.from({ length: skeletonCount }).map((_, idx) => (
            <article key={`skeleton-${idx}`} className="rounded-xl border border-[#DADCE0] bg-white">
              <div className="px-5 pt-[18px]">
                <div className="flex gap-2.5">
                  <div className="h-10 w-10 rounded-lg wg-skeleton-shimmer" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-48 rounded wg-skeleton-shimmer" />
                    <div className="h-3 w-32 rounded wg-skeleton-shimmer" />
                  </div>
                </div>
              </div>
              <div className="mx-5 my-2.5 border-t border-[#F3F4F6]" />
              <div className="px-5 pb-4">
                <div className="h-3 w-40 rounded wg-skeleton-shimmer" />
                <div className="mt-2.5 h-7 w-36 rounded-lg wg-skeleton-shimmer" />
              </div>
            </article>
          ))}
        </div>
      ) : (
      <div className="relative">
        {showPageLoadingOverlay ? (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center rounded-xl bg-white/60 pt-8 backdrop-blur-[1px]"
            aria-hidden
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#DADCE0] bg-white px-4 py-2 text-sm text-[#3A3A3C] shadow-sm">
              <Loader2 className={iconClass("inline", "animate-spin text-[#1A73E8]")} />
              Loading page {safePage}…
            </span>
          </div>
        ) : null}
      <div
        className={cn(
          viewMode === "grid" ? "grid gap-1.5 md:grid-cols-2 xl:grid-cols-3" : "job-list",
          showPageLoadingOverlay && "opacity-60 transition-opacity duration-200"
        )}
      >
        {shouldVirtualize ? null : visibleJobs.map(({ job, meta, score }, i) => {
          const applyHref = job.applyUrl?.trim();
          const canApply = Boolean(applyHref);
          const isSaved = savedJobs.has(job.id);
          const isExpanded = expandedJobId === job.id;
          const reqs = job.matchedSkills.slice(0, 6).map((skill) => ({
            label: skill,
            status: "ok" as const,
          }));

          return (
            <JobCard
              key={job.id}
              id={`job-card-${job.id}`}
              job={recommendedJobToCardData(job, {
                matchPercent: score,
                experienceLevel: meta.experienceLevel,
                primaryJobType: meta.primaryJobType ?? meta.jobTypes[0] ?? null,
              })}
              index={i}
              saved={isSaved}
              hasResume={hasResume}
              onSave={(id) => {
                if (!userId) return;
                const nowSaved = toggleSavedJobId(userId, id);
                setSavedJobs((prev) => {
                  const next = new Set(prev);
                  if (nowSaved) next.add(id);
                  else next.delete(id);
                  return next;
                });
                if (nowSaved) emitNavFeedback("hidden-jobs", "pulse");
              }}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileDetailJobId(job.id);
                } else {
                  setExpandedJobId((prev) => (prev === job.id ? null : job.id));
                }
              }}
              onApplyClick={() => emitNavFeedback("applications", "glow")}
              className={cn(viewMode === "grid" && "flex min-h-0 flex-col")}
            >
              {isExpanded ? (
                <div className="space-y-3">
                  <div className="max-h-[200px] overflow-auto text-sm leading-6 text-gray-600">
                    {job.description?.trim() ? job.description : job.matchLabel}
                  </div>
                  <ul className="space-y-1 text-sm">
                    {reqs.map((r) => (
                      <li key={r.label} className="flex items-center gap-2">
                        {r.status === "ok" ? (
                          <Check className={iconClass("inline", "text-[#16A34A]")} />
                        ) : r.status === "warn" ? (
                          <TriangleAlert className={iconClass("inline", "text-gray-400")} />
                        ) : (
                          <X className={iconClass("inline", "text-gray-400")} />
                        )}
                        <span className="text-gray-600">{r.label}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    {meta.companySize ? <span>Company size: {meta.companySize}</span> : null}
                    {meta.industries.length > 0 ? <span>Industry: {meta.industries.join(", ")}</span> : null}
                    {meta.benefits.length > 0 ? <span>Benefits: {meta.benefits.join(", ")}</span> : null}
                    {meta.hasVisaSponsorship ? <span>Visa sponsorship available</span> : null}
                  </div>
                  {canApply && applyHref ? (
                    <JobApplyButton
                      jobId={job.id}
                      company={job.company}
                      title={job.title}
                      applyUrl={applyHref}
                      source={job.source}
                      className="w-full justify-center"
                    />
                  ) : null}
                  <ResumeIntelligenceDialog
                    jobId={job.id}
                    jobTitle={job.title}
                    company={job.company}
                    jobDescription={job.description?.trim() || job.matchLabel || job.title}
                    hasResume={hasResume}
                    triggerClassName="analyze-btn w-full justify-center"
                  />
                </div>
              ) : null}
            </JobCard>
          );
        })
        }
      </div>
      </div>
      )}

      {totalMatched > 0 ? (
        <nav
          className="mt-6 flex flex-col items-center gap-3 border-t border-[#DADCE0] pt-5"
          aria-label="Job results pagination"
        >
          <p className="text-[13px] text-[#8E8E93]">
            Showing {rangeStart}-{rangeEnd} of {totalMatched.toLocaleString()} jobs
          </p>
          {totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-center gap-1">
              <button
                type="button"
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage <= 1 || isPageLoading}
                aria-label="Previous page"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#DADCE0] bg-white text-[#3A3A3C] transition hover:border-[#1A73E8] hover:bg-[#E8F0FE] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className={iconClass()} />
              </button>
              {paginationTokens.map((token, index) =>
                token === "ellipsis" ? (
                  <span key={`ellipsis-${index}`} className="px-1 text-sm text-[#8E8E93]">
                    …
                  </span>
                ) : (
                  <button
                    key={token}
                    type="button"
                    onClick={() => goToPage(token)}
                    disabled={isPageLoading}
                    aria-label={`Page ${token}`}
                    aria-current={token === safePage ? "page" : undefined}
                    className={cn(
                      "inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-medium transition",
                      token === safePage
                        ? "bg-[#1A73E8] text-white shadow-sm"
                        : "border border-[#DADCE0] bg-white text-[#3A3A3C] hover:border-[#1A73E8] hover:bg-[#E8F0FE]"
                    )}
                  >
                    {token}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage >= totalPages || isPageLoading}
                aria-label="Next page"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#DADCE0] bg-white text-[#3A3A3C] transition hover:border-[#1A73E8] hover:bg-[#E8F0FE] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className={iconClass()} />
              </button>
            </div>
          ) : null}
        </nav>
      ) : null}

      {!showSkeleton &&
      listingPipeline.length === 0 &&
      showProfileMatchesOnly &&
      (liveListings > 0 || pageJobs.length > 0) ? (
        <div className="rounded-xl border border-[#DADCE0] bg-white px-6 py-10 text-center">
          <UserSearch className="mx-auto h-20 w-20 text-[#1A73E8]" />
          <h3 className="mt-4 text-[20px] font-semibold text-[#1D1D1F]">No profile matches found</h3>
          <p className="mt-2 text-sm text-[#8E8E93]">
            {matchedListings > 0
              ? `${matchedListings.toLocaleString()} jobs match your profile in the index. Try browsing all jobs or updating your skills.`
              : `${liveListings.toLocaleString()} jobs are indexed, but none overlap your current skills. Browse the full catalog or update your profile.`}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setShowProfileMatchesOnly(false);
                setSkillsPick(new Set());
                setCurrentPage(1);
              }}
              className="inline-flex h-10 items-center rounded-[20px] bg-[#1A73E8] px-5 text-sm font-medium text-white hover:bg-[#1557B0]"
            >
              Browse all {liveListings.toLocaleString()} jobs
            </button>
            <Link
              href="/profile?view=profile"
              className="inline-flex h-10 items-center rounded-[20px] border border-[#1A73E8] px-5 text-sm font-medium text-[#1A73E8]"
            >
              Update profile skills
            </Link>
          </div>
        </div>
      ) : null}

      {!showSkeleton && listingPipeline.length === 0 && !userFiltersActive && liveListings === 0 && !isPageLoading ? (
        <div className="rounded-xl border border-[#DADCE0] bg-white px-6 py-10 text-center">
          <SearchX className="mx-auto h-20 w-20 text-[#DADCE0]" />
          <h3 className="mt-4 text-[20px] font-semibold text-[#1D1D1F]">No jobs indexed yet</h3>
          <p className="mt-2 text-sm text-[#8E8E93]">
            Run the job ingest pipeline to populate live listings from ATS sources.
          </p>
        </div>
      ) : null}

      {!showSkeleton && listingPipeline.length === 0 && !userFiltersActive && liveListings > 0 && !showProfileMatchesOnly && !isPageLoading ? (
        <div className="rounded-xl border border-[#DADCE0] bg-white px-6 py-10 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#1A73E8]" />
          <h3 className="mt-4 text-[20px] font-semibold text-[#1D1D1F]">Loading jobs…</h3>
          <p className="mt-2 text-sm text-[#8E8E93]">
            {liveListings.toLocaleString()} jobs are indexed. Fetching listings now.
          </p>
        </div>
      ) : null}

      {!showSkeleton && listingPipeline.length === 0 && userFiltersActive && skillHints.length > 0 && !showProfileMatchesOnly ? (
        <div className="rounded-xl border border-[#DADCE0] bg-white px-6 py-10 text-center">
          <SearchX className="mx-auto h-20 w-20 text-[#DADCE0]" />
          <h3 className="mt-4 text-[20px] font-semibold text-[#1D1D1F]">No jobs found</h3>
          <p className="mt-2 text-sm text-[#8E8E93]">Try adjusting your filters or search terms</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 items-center rounded-[20px] border border-[#1A73E8] px-5 text-sm font-medium text-[#1A73E8]"
            >
              Clear all filters
            </button>
            <button
              type="button"
              onClick={() => {
                clearFilters();
                setCurrentPage(1);
              }}
              className="text-sm font-medium text-[#1A73E8] underline underline-offset-2"
            >
              Browse all jobs
            </button>
          </div>
        </div>
      ) : null}

      {!showSkeleton && listingPipeline.length === 0 && userFiltersActive && skillHints.length === 0 ? (
        <div className="rounded-xl border border-[#DADCE0] bg-white px-6 py-10 text-center">
          <UserSearch className="mx-auto h-20 w-20 text-[#1A73E8]" />
          <h3 className="mt-4 text-[20px] font-semibold text-[#1D1D1F]">Complete your profile to see matches</h3>
          <div className="mx-auto mt-4 flex max-w-sm flex-col items-start gap-2 text-sm">
            <Link href="/create-profile#skills" className="inline-flex items-center gap-1 text-[#1A73E8]">Add your skills <ArrowRight className={iconClass()} /></Link>
            <Link href="/create-profile#salary" className="inline-flex items-center gap-1 text-[#1A73E8]">Add expected salary <ArrowRight className={iconClass()} /></Link>
            <Link href="/create-profile#location" className="inline-flex items-center gap-1 text-[#1A73E8]">Add location preference <ArrowRight className={iconClass()} /></Link>
          </div>
          <Link
            href="/create-profile"
            className="mt-5 inline-flex h-10 items-center rounded-[20px] bg-[#1A73E8] px-5 text-sm font-medium text-white hover:bg-[#1557B0]"
          >
            Complete Profile
          </Link>
        </div>
      ) : null}
      </div>

      {skillHints.length > 0 ? (
        <aside className="right-sidebar hidden lg:sticky lg:top-[calc(var(--dash-topnav-h,56px)+36px)] lg:mt-9 lg:block lg:self-start">
          <section className="sidebar-card">
            <h3 className="card-title">Your Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {skillHints.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center rounded-full border border-[#DADCE0] bg-[#F8F9FA] px-2.5 py-0.5 text-xs text-[#3A3A3C]"
                >
                  {skill}
                </span>
              ))}
            </div>
            {matchedListings > 0 ? (
              <p className="match-overall mt-3">
                {matchedListings.toLocaleString()} jobs match your profile
              </p>
            ) : null}
            <Link href="/profile?view=profile" className="mt-2 inline-block text-xs font-medium text-[#1A73E8] hover:underline">
              Update profile
            </Link>
          </section>
        </aside>
      ) : null}
      </div>

      {mobileDetailJobId ? (
        <div className="fixed inset-0 z-[125] bg-white p-4 md:hidden">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#1D1D1F]">Job Details</h3>
            <button type="button" onClick={() => setMobileDetailJobId(null)}>
              <X className="h-5 w-5 text-[#5F6368]" />
            </button>
          </div>
          {(() => {
            const jobEntry = listingPipeline.find(({ job }) => job.id === mobileDetailJobId);
            if (!jobEntry) return <p className="text-sm text-[#8E8E93]">Job not available.</p>;
            const { job, meta } = jobEntry;
            return (
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-[#1D1D1F]">{job.title}</h4>
                <p className="text-sm text-[#3A3A3C]">{job.company}</p>
                <p className="text-sm text-[#8E8E93]">
                  {job.location}
                  {meta.jobTypes[0] ? ` · ${meta.jobTypes[0]}` : ""}
                </p>
                <p className="max-h-[45vh] overflow-auto text-sm leading-6 text-[#3A3A3C]">
                  {job.description?.trim() ? job.description : job.matchLabel}
                </p>
                {job.applyUrl ? (
                  <JobApplyButton
                    jobId={job.id}
                    company={job.company}
                    title={job.title}
                    applyUrl={job.applyUrl}
                    source={job.source}
                    className="w-full justify-center"
                  />
                ) : null}
                <ResumeIntelligenceDialog
                  jobId={job.id}
                  jobTitle={job.title}
                  company={job.company}
                  jobDescription={job.description?.trim() || job.matchLabel || job.title}
                  hasResume={hasResume}
                  triggerClassName="analyze-btn w-full justify-center"
                />
              </div>
            );
          })()}
        </div>
      ) : null}

      {showScrollTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-[110] inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#DADCE0] bg-white text-[#5F6368] transition hover:bg-[#F8F9FA] hover:shadow-md"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      ) : null}

      <ApplyFollowupPrompt onMarkApplied={markJobApplied} onSaveForLater={saveJobForLater} />
    </section>
  );
}
