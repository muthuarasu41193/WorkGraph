"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  ArrowUpRight,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  GraduationCap,
  ExternalLink,
  LayoutGrid,
  LayoutList,
  LifeBuoy,
  MapPin,
  Sparkles,
  SearchX,
  SlidersHorizontal,
  Star,
  Target,
  TriangleAlert,
  Zap,
  ArrowUp,
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
  hasClientOnlyJobFilters,
  type JobListingFilterState,
} from "../../lib/job-listing-filters";
import { scoreJobCard, type ProfileMatchInput } from "../../lib/job-match";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search } from "@/components/ui/search";
import { Spinner } from "@/components/ui/spinner";
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
import ResumeIntelligenceDialog from "@/components/talent-intelligence/ResumeIntelligenceDialog";

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
const SORT_OPTIONS = ["best", "newest", "salary_desc", "salary_asc", "company_asc"] as const;
const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "INR"] as const;

const PAGE_SIZE = 50;
/** Rows loaded when advanced (client-only) filters need a local pool to paginate. */
const FILTER_POOL_CAP = 2500;
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

const FILTER_TRIGGER_BASE_CLASS =
  "inline-flex h-10 cursor-pointer list-none items-center gap-1 rounded-full border px-4 text-body transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--info)] focus-visible:ring-offset-2";
const FILTER_TRIGGER_INACTIVE_CLASS =
  `${FILTER_TRIGGER_BASE_CLASS} border-[var(--border-default)] bg-surface-primary text-[var(--text-secondary)] hover:border-[var(--info)] hover:bg-[var(--info-subtle)]`;
const FILTER_TRIGGER_ACTIVE_CLASS = `${FILTER_TRIGGER_BASE_CLASS} border-[var(--info)] bg-[var(--info)] text-white`;

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

function formatSalaryRange(salary: SalaryMeta | null): string {
  if (!salary) return "Salary not listed";
  const prefix = CURRENCY_SYMBOLS[salary.currency] ?? `${salary.currency} `;
  const unit = salary.period === "hour" ? "/hr" : "";
  return `${prefix}${salary.minK}K - ${prefix}${salary.maxK}K${unit}`;
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
  /** Total indexed live rows — used while the full catalog loads client-side. */
  liveListings?: number;
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

function companyInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "CO";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function RecommendedJobsSection({
  jobs: initialJobs,
  skillHints,
  profileHeadline = null,
  profileSummary = null,
  feedKind,
  feedDemoHint,
  liveListings = 0,
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
      ? isLiveFeed
        ? `Sorted by fit to your resume — skills, headline, and summary matched against each role (${skillHints.slice(0, 4).join(", ")}${skillHints.length > 4 ? "…" : ""}).`
        : `Demo cards — once ingest fills Postgres, listings personalize against ${skillHints.slice(0, 3).join(", ")}${skillHints.length > 3 ? "…" : ""}.`
      : isLiveFeed
        ? "Add skills, headline, and summary on your profile so we can rank roles that fit your background."
        : "Add skills to your profile to sharpen ranking after ingest runs.";

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
  const [sortBy, setSortBy] = useState<"best" | "newest" | "salary_desc" | "salary_asc" | "company_asc">(
    parseEnumParam(searchParams.get("sort"), SORT_OPTIONS, "best")
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
  const [bouncingBookmarkId, setBouncingBookmarkId] = useState<string | null>(null);
  /** When true (e.g. "Matched to your profile" dashboard card), hide jobs with no profile overlap. */
  const [showProfileMatchesOnly, setShowProfileMatchesOnly] = useState(false);
  const deferredSearchInput = useDeferredValue(searchInput);
  const query = searchInput.trim();
  const isSearching = deferredSearchInput !== searchInput;

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
    () => hasAnyUserJobFilters(catalogFilters, clientFilterState),
    [catalogFilters, clientFilterState]
  );

  const useServerJobs = isLiveFeed;
  const needsClientFilterPool = useServerJobs && hasClientOnlyJobFilters(clientFilterState);

  const profileOverlapOptions = useMemo(
    () => ({
      profile: profileMatch,
      requireProfileOverlap:
        showProfileMatchesOnly && profileMatchActive && isLiveFeed && !userFiltersActive,
      minProfileScore: MIN_PROFILE_RELEVANCE_SCORE,
    }),
    [profileMatch, showProfileMatchesOnly, profileMatchActive, isLiveFeed, userFiltersActive]
  );

  const listingPipeline = useMemo(() => {
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
    const fetchSize = needsClientFilterPool ? FILTER_POOL_CAP : PAGE_SIZE;

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
        setCurrentPage(1);
        if (skillHints.length > 0) {
          setSkillsPick(new Set([skillHints[0]]));
        }
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
    sources.size > 0 ? { key: "source", label: `Source: ${sources.size}` } : null,
    jobTypes.size > 0 ? { key: "jobType", label: `Job Type: ${jobTypes.size}` } : null,
    (locationMode !== "any" || locationQuery.trim()) ? { key: "location", label: `Location` } : null,
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

  const matchBreakdown = [
    { label: "Skills", score: 87, color: "var(--info)", detail: "React, Node.js, Python +12 more" },
    { label: "Experience", score: 92, color: "var(--success)", detail: "5 years matches senior roles" },
    { label: "Location", score: 100, color: "var(--warning)", detail: "Remote preferred" },
    { label: "Salary", score: 78, color: "var(--info)", detail: "$120K-$180K range" },
    { label: "Industry", score: 85, color: "var(--success)", detail: "Tech, SaaS, FinTech" },
  ];
  const overallMatch = Math.round(matchBreakdown.reduce((acc, item) => acc + item.score, 0) / matchBreakdown.length);
  const ringRadius = 34;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (overallMatch / 100) * ringCircumference;

  return (
    <section id="recommended-jobs" className="scroll-mt-32 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 wg-section-fade" style={{ animationDelay: "0ms" }}>
        <div className="min-w-0 flex-1">
          <p className="text-caption font-medium uppercase tracking-[var(--letter-spacing-label)] text-[var(--text-tertiary)]">Job board</p>
          <h2 className="mt-1 text-title font-semibold text-[var(--text-primary)] sm:text-title">
            {isLiveFeed
              ? profileMatchActive
                ? "Jobs matching your profile"
                : "Browse live job listings"
              : "Sample roles (run ingest or community sync for live data)"}
          </h2>
          <p className="mt-2 max-w-2xl text-body font-normal text-[var(--text-secondary)]">{hint}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-caption font-medium uppercase tracking-wide ring-1 ${
            isLiveFeed
              ? "border-0 bg-[var(--info-subtle)] text-[var(--info-foreground)] ring-[var(--border-default)]"
              : "border-[var(--border-default)] bg-[var(--warning-subtle)] text-[var(--text-secondary)] ring-[var(--border-default)]"
          }`}
        >
          {isLiveFeed ? "Live Postgres feed" : "Demo preview"}
        </span>
      </div>

      {!isLiveFeed && feedDemoHint ? (
        <div className="flex gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--warning-subtle)] p-4 text-body text-[var(--text-secondary)] ring-1 ring-[var(--border-default)] wg-section-fade" style={{ animationDelay: "100ms" }}>
          <span className="mt-1 shrink-0 text-warning-foreground">
            <LifeBuoy className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 space-y-2">
            <p className="font-semibold leading-snug text-warning-foreground">{demoBannerCopy(feedDemoHint).title}</p>
            <p className="leading-relaxed text-warning-foreground/95">{demoBannerCopy(feedDemoHint).body}</p>
            <p className="text-caption text-warning-foreground/90">
              <Link
                href="/api/jobs-health"
                className="font-medium underline decoration-[var(--warning)] underline-offset-2 hover:text-[var(--text-primary)]"
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

      <section className="rounded-xl border border-[var(--border-default)] bg-surface-primary px-6 py-5 lg:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-body-lg font-semibold text-[var(--text-primary)]">Your Match Profile</h3>
            <p className="mt-1 text-body text-[var(--text-tertiary)]">Based on your profile, we match jobs by:</p>
          </div>
          <IconButton
            type="button"
            variant="secondary"
            iconSize="sm"
            onClick={() => setIsMatchProfileExpanded((v) => !v)}
            className="h-8 w-8 rounded-lg"
            label={isMatchProfileExpanded ? "Collapse profile analysis" : "Expand profile analysis"}
            icon={isMatchProfileExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          />
        </div>

        {isMatchProfileExpanded ? (
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-1 flex-col gap-2 md:flex-row md:flex-wrap">
              {matchBreakdown.map((item) => (
                <article key={item.label} className="w-full rounded-full border border-[var(--border-default)] bg-[var(--surface-secondary)] px-4 py-3 md:w-[calc(50%-8px)] lg:w-[calc(33.333%-8px)] xl:w-[calc(20%-8px)]">
                  <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-[var(--info-subtle)]">
                    <div className="h-full rounded-full" style={{ width: `${item.score}%`, backgroundColor: item.color }} />
                  </div>
                  <p className="text-body font-semibold text-[var(--text-primary)]">
                    {item.label} <span className="text-[var(--text-secondary)]">{item.score}%</span>
                  </p>
                  <p className="mt-1 text-caption text-[var(--text-tertiary)]">{item.detail}</p>
                </article>
              ))}
            </div>

            <div className="flex shrink-0 flex-col items-center justify-center rounded-xl border border-[var(--border-default)] bg-surface-primary px-5 py-4">
              <div className="relative h-20 w-20">
                <svg viewBox="0 0 80 80" className="-rotate-90">
                  <circle cx="40" cy="40" r={ringRadius} fill="none" stroke="var(--info-subtle)" strokeWidth="8" />
                  <circle
                    cx="40"
                    cy="40"
                    r={ringRadius}
                    fill="none"
                    stroke="var(--info)"
                    strokeWidth="8"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-heading-m text-[var(--info)]">{overallMatch}%</div>
              </div>
              <p className="mt-1 text-caption text-[var(--text-tertiary)]">Match Score</p>
              <Link href="/create-profile" className="mt-2 text-body font-medium text-[var(--info)] hover:underline">
                Update profile to improve matches
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      {fetchError ? (
        <div className="rounded-xl border border-[var(--danger-subtle)] bg-[var(--danger-subtle)] p-4 text-body text-[var(--text-secondary)]">
          <p className="font-semibold text-[var(--danger)]">Could not load more jobs</p>
          <p className="mt-1 text-[var(--text-secondary)]">{fetchError}</p>
        </div>
      ) : null}

      {liveListings > 0 ? (
        <p className="text-body text-[var(--text-secondary)]">
          {showProfileMatchesOnly ? (
            <>
              <span className="font-semibold text-[var(--info)]">{totalMatched.toLocaleString()}</span> jobs match your
              profile
              {liveListings > totalMatched ? ` · ${liveListings.toLocaleString()} indexed in Postgres` : ""}.
            </>
          ) : (
            <>
              <span className="font-semibold text-[var(--info)]">{totalMatched.toLocaleString()}</span> jobs in catalog
              {liveListings > totalMatched ? ` · ${liveListings.toLocaleString()} indexed in Postgres` : ""} — ranked by
              profile fit when skills are set.
            </>
          )}{" "}
          Browse by page below.
        </p>
      ) : null}

      {(initialJobs.length > 0 || isLiveFeed) ? (
        <>
          <div className="md:hidden">
            <Button
              type="button"
              onClick={() => setIsMobileFiltersOpen(true)}
              variant="outline"
              className="rounded-full"
              aria-label="Open filters panel"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 ? (
                <Badge variant="default" className="ml-1">
                  {activeFilterCount}
                </Badge>
              ) : null}
            </Button>
          </div>

          <section className="sticky top-[var(--sticky-below-header)] z-[100] hidden border-b border-[var(--border-default)] bg-[rgba(255,255,255,0.95)] py-3 backdrop-blur-[8px] md:block">
            <div className="wg-no-scrollbar flex items-center gap-2 overflow-x-auto">
              <Search
                shape="pill"
                size="md"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search job titles, companies..."
                clearable
                onClear={() => setSearchInput("")}
                loading={isSearching}
                className="pl-12"
                containerClassName="w-full min-w-[280px] md:w-[280px] md:min-w-[280px]"
              />
              {query.trim() && !isSearching && !isPageLoading && userFiltersActive && listingPipeline.length === 0 ? (
                <p className="ml-2 text-caption text-[var(--text-tertiary)]">No results for &quot;{query.trim()}&quot;.</p>
              ) : null}

              <details data-filter-dropdown="true" className="relative shrink-0">
                <summary className={jobTypes.size > 0 ? FILTER_TRIGGER_ACTIVE_CLASS : FILTER_TRIGGER_INACTIVE_CLASS}>
                  {jobTypes.size > 0 ? `Job Type · ${jobTypes.size}` : "Job Type"} <ChevronDown className="h-4 w-4" />
                </summary>
                <div data-filter-menu="true" className="absolute left-0 top-12 z-20 w-52 rounded-xl border border-[var(--border-default)] bg-surface-primary p-2 shadow-lg">
                  {JOB_TYPE_OPTIONS.map((type) => (
                    <label key={type} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-body hover:bg-[var(--surface-secondary)]">
                      <Checkbox
                        checked={jobTypes.has(type)}
                        onCheckedChange={() => {
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
                <summary className={locationMode !== "any" || locationQuery.trim() ? FILTER_TRIGGER_ACTIVE_CLASS : FILTER_TRIGGER_INACTIVE_CLASS}>
                  <MapPin className="h-4 w-4" /> Location <ChevronDown className="h-4 w-4" />
                </summary>
                <div data-filter-menu="true" className="absolute left-0 top-12 z-20 w-64 rounded-xl border border-[var(--border-default)] bg-surface-primary p-3 shadow-lg">
                  <Input
                    size="sm"
                    value={locationQuery}
                    onChange={(e) => {
                      setLocationQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Country or city"
                    className="mb-2"
                  />
                  <div className="flex flex-wrap gap-2">
                    {["any", "remote", "hybrid", "onsite"].map((loc) => (
                      <Button
                        key={loc}
                        type="button"
                        size="sm"
                        variant={locationMode === loc ? "primary" : "secondary"}
                        onClick={() => {
                          setLocationMode(loc as "any" | "remote" | "hybrid" | "onsite");
                          setCurrentPage(1);
                        }}
                        className="rounded-lg text-caption"
                      >
                        {loc === "any" ? "Any" : loc === "onsite" ? "On-site" : loc[0].toUpperCase() + loc.slice(1)}
                      </Button>
                    ))}
                  </div>
                  <p className="mt-2 text-caption text-[var(--text-tertiary)]">Popular: Remote, New York, London, San Francisco</p>
                </div>
              </details>

              <details data-filter-dropdown="true" className="relative shrink-0">
                <summary className={dateWindow !== "any" ? FILTER_TRIGGER_ACTIVE_CLASS : FILTER_TRIGGER_INACTIVE_CLASS}>
                  Date posted <ChevronDown className="h-4 w-4" />
                </summary>
                <div data-filter-menu="true" className="absolute left-0 top-12 z-20 w-48 rounded-xl border border-[var(--border-default)] bg-surface-primary p-2 shadow-lg">
                  {DATE_OPTIONS.map((d) => (
                    <Button
                      key={d.id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDateWindow(d.id);
                        setCurrentPage(1);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-body"
                    >
                      {d.label}
                      {dateWindow === d.id ? <Check className="h-4 w-4 text-[var(--info)]" /> : null}
                    </Button>
                  ))}
                </div>
              </details>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsMoreFiltersOpen(true)}
                className={`${advancedFilterCount > 0 ? FILTER_TRIGGER_ACTIVE_CLASS : FILTER_TRIGGER_INACTIVE_CLASS} shrink-0`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Advanced
                {advancedFilterCount > 0 ? ` · ${advancedFilterCount}` : ""}
              </Button>
            </div>
          </section>

          {hasActiveFilters ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-caption text-[var(--text-tertiary)]">Active filters:</span>
              {activeFilterChips.map((chip) => (
                <span key={chip.key} className="inline-flex items-center gap-1 rounded-2xl bg-[var(--info-subtle)] px-2 py-1 pl-3 text-caption text-[var(--info)] transition-all duration-200 wg-chip-enter">
                  {chip.label}
                  <IconButton
                    type="button"
                    variant="ghost"
                    iconSize="sm"
                    onClick={() => removeChip(chip.key)}
                    className="text-[var(--info)] hover:text-[var(--info-foreground)]"
                    label={`Remove ${chip.label} filter`}
                    icon={<X className="h-4 w-4" />}
                  />
                </span>
              ))}
              <Button type="button" variant="link" size="sm" onClick={clearFilters} className="ml-1 text-body font-medium text-[var(--danger)]">
                Clear all filters
              </Button>
            </div>
          ) : null}

          <p className="mt-3 text-body text-[var(--text-secondary)]" aria-live="polite">
            {visibleJobs.length > 0 ? (
              <>
                Showing{" "}
                <span className="font-semibold text-[var(--info)]">
                  {rangeStart.toLocaleString()}-{rangeEnd.toLocaleString()}
                </span>{" "}
                of <span className="font-semibold text-[var(--info)]">{totalMatched.toLocaleString()}</span> jobs
              </>
            ) : (
              <>
                <span className="font-semibold text-[var(--info)]">{totalMatched.toLocaleString()}</span> jobs total
              </>
            )}
            {" "}
            · Page <span className="font-semibold text-[var(--info)]">{safePage}</span> of{" "}
            <span className="text-[var(--text-tertiary)]">{totalPages.toLocaleString()}</span>
            {useServerJobs ? (
              <span className="text-[var(--text-tertiary)]">
                {" "}
                · {PAGE_SIZE} per page
                {needsClientFilterPool ? ` · advanced filters on ${FILTER_POOL_CAP.toLocaleString()} loaded jobs` : ""}
              </span>
            ) : null}
            {isPageLoading ? (
              <span className="ml-2 inline-flex items-center gap-1 text-caption text-[var(--text-tertiary)]">
                <Spinner size="xs" aria-hidden />
                Loading page…
              </span>
            ) : null}
          </p>
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
                <Select value={currency} onValueChange={(v) => setCurrency(v as (typeof CURRENCY_OPTIONS)[number])}>
                  <SelectTrigger size="sm" className="w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <label className="flex cursor-pointer items-center gap-2 text-body">
              <Checkbox checked={visaSponsorshipOnly} onCheckedChange={(c) => setVisaSponsorshipOnly(c === true)} />
              Visa sponsorship
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-body">
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div className="min-w-0">
      {(listingPipeline.length > 0 || isPageLoading || userFiltersActive) ? (
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex rounded-lg border border-border p-1" role="group" aria-label="Choose jobs list view">
            <Button
              type="button"
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("list")}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="min-w-[220px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="best">Best Match</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="salary_desc">Salary: High to Low</SelectItem>
              <SelectItem value="salary_asc">Salary: Low to High</SelectItem>
              <SelectItem value="company_asc">Company Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {showSkeleton ? (
        <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
          {Array.from({ length: skeletonCount }).map((_, idx) => (
            <article key={`skeleton-${idx}`} className="rounded-xl border border-[var(--border-default)] bg-surface-primary p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="h-12 w-12 rounded-lg wg-skeleton-shimmer" />
                  <div className="space-y-2">
                    <div className="h-4 w-48 rounded wg-skeleton-shimmer" />
                    <div className="h-3 w-32 rounded wg-skeleton-shimmer" />
                    <div className="h-3 w-40 rounded wg-skeleton-shimmer" />
                  </div>
                </div>
                <div className="h-6 w-20 rounded-2xl wg-skeleton-shimmer" />
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                <div className="h-6 w-28 rounded-xl wg-skeleton-shimmer" />
                <div className="h-6 w-24 rounded-xl wg-skeleton-shimmer" />
                <div className="h-6 w-24 rounded-xl wg-skeleton-shimmer" />
              </div>
              <div className="mb-3 flex gap-2">
                <div className="h-5 w-16 rounded-xl wg-skeleton-shimmer" />
                <div className="h-5 w-16 rounded-xl wg-skeleton-shimmer" />
                <div className="h-5 w-20 rounded-xl wg-skeleton-shimmer" />
              </div>
              <div className="h-9 w-36 rounded-[18px] wg-skeleton-shimmer" />
            </article>
          ))}
        </div>
      ) : (
      <div className="relative">
        {showPageLoadingOverlay ? (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center rounded-xl bg-surface-primary/60 pt-8 backdrop-blur-[1px]"
            aria-hidden
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-surface-primary px-4 py-2 text-body text-[var(--text-secondary)] shadow-sm">
              <Spinner className="text-[var(--info)]" />
              Loading page {safePage}…
            </span>
          </div>
        ) : null}
      <div
        className={cn(
          viewMode === "grid" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-3",
          showPageLoadingOverlay && "opacity-60 transition-opacity duration-200"
        )}
      >
        {shouldVirtualize ? null : visibleJobs.map(({ job, meta, score }, i) => {
          const src = SOURCE_STYLES[job.source];
          const applyHref = job.applyUrl?.trim();
          const canApply = Boolean(applyHref);
          const isSaved = savedJobs.has(job.id);
          const isNew = (new Date().getTime() - new Date(job.postedAtIso || 0).getTime()) < 86400000;
          const isFresh = (new Date().getTime() - new Date(job.postedAtIso || 0).getTime()) < 86400000 * 3;
          const isExpanded = expandedJobId === job.id;
          const reqs = [
            { label: "React", status: "ok" },
            { label: "Node.js", status: "ok" },
            { label: "AWS", status: "warn" },
            { label: "Docker", status: "miss" },
          ] as const;
          const MatchIcon = score >= 90 ? Target : score >= 75 ? BadgeCheck : Zap;
          const matchBadge =
            score >= 90
              ? { bg: "var(--success-subtle)", fg: "var(--success)", label: `${score}% Match` }
              : score >= 75
                ? { bg: "var(--info-subtle)", fg: "var(--info)", label: `${score}% Match` }
                : score >= 60
                  ? { bg: "var(--warning-subtle)", fg: "var(--warning)", label: `${score}% Match` }
                  : { bg: "var(--surface-secondary)", fg: "var(--text-tertiary)", label: `${score}% Match` };

          return (
            <Card
              key={job.id}
              style={{ animationDelay: `${50 * i}ms` }}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileDetailJobId(job.id);
                } else {
                  setExpandedJobId((prev) => (prev === job.id ? null : job.id));
                }
              }}
              className={cn(
                "group relative cursor-pointer border-border shadow-sm transition-all duration-200 hover:border-primary hover:shadow-lg wg-job-card-enter",
                viewMode === "grid" && "flex min-h-[320px] flex-col"
              )}
            >
              <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <div
                    className={`${viewMode === "grid" ? "h-10 w-10" : "h-12 w-12"} relative shrink-0 overflow-hidden rounded-[14px] border border-border bg-muted`}
                    aria-label={`${job.company} logo placeholder`}
                  >
                    <Building2 className="absolute left-1.5 top-2 h-3.5 w-3.5 text-[var(--text-secondary)]" aria-hidden />
                    <span className="absolute bottom-1 right-1 text-caption font-semibold tracking-wide text-[var(--text-secondary)]">
                      {companyInitials(job.company)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-body-lg font-semibold leading-snug text-[var(--text-primary)] transition-colors group-hover:text-[var(--info)]">{job.title}</h3>
                    <p className="mt-1 text-body font-medium text-[var(--text-secondary)]">{job.company}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-body text-[var(--text-tertiary)]">
                      <MapPin className="h-3 w-3" /> {job.location}
                      {meta.jobTypes[0] ? ` · ${meta.jobTypes[0]}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="group/score relative inline-flex items-center rounded-2xl px-3 py-1 text-caption font-semibold" style={{ backgroundColor: matchBadge.bg, color: matchBadge.fg }}>
                    <MatchIcon className="mr-1 inline h-3.5 w-3.5" />
                    {matchBadge.label}
                    <span className="pointer-events-none absolute right-0 top-full z-20 mt-1 hidden w-48 rounded-lg border border-[var(--border-default)] bg-surface-primary px-2 py-1 text-caption font-normal text-[var(--text-secondary)] shadow-lg group-hover/score:block">
                      Skills 60% · Experience 20% · Location 20%
                    </span>
                  </span>
                  <IconButton
                    type="button"
                    variant="ghost"
                    iconSize="md"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBouncingBookmarkId(job.id);
                      window.setTimeout(() => setBouncingBookmarkId(null), 250);
                      setSavedJobs((prev) => {
                        const next = new Set(prev);
                        if (next.has(job.id)) next.delete(job.id);
                        else next.add(job.id);
                        return next;
                      });
                    }}
                    title="Save job"
                    label="Save job"
                    className={`rounded-md text-[var(--text-tertiary)] transition hover:bg-[var(--info-subtle)] hover:text-[var(--info)] ${bouncingBookmarkId === job.id ? "wg-bookmark-bounce" : ""}`}
                    icon={isSaved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--surface-secondary)] px-3 py-1 text-caption text-[var(--text-secondary)]"><Banknote className="h-3.5 w-3.5" /> {formatSalaryRange(meta.salary)}</span>
                {meta.experienceLevel ? (
                  <span className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--surface-secondary)] px-3 py-1 text-caption text-[var(--text-secondary)]"><GraduationCap className="h-3.5 w-3.5" /> {meta.experienceLevel}</span>
                ) : null}
                <span className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1 text-caption ${isFresh ? "border-[var(--success-subtle)] bg-[var(--success-subtle)] text-[var(--success)]" : "border-[var(--border-default)] bg-[var(--surface-secondary)] text-[var(--text-tertiary)]"}`}><CalendarDays className="h-3.5 w-3.5" /> {job.postedAgo}</span>
                <span className="rounded-xl bg-info-subtle px-3 py-1 text-caption text-[var(--info)]">via {src.label}</span>
                {meta.isEasyApply ? <span className="inline-flex items-center gap-1 rounded-xl bg-[var(--success-subtle)] px-3 py-1 text-caption text-[var(--success)]"><ArrowUpRight className="h-3.5 w-3.5" /> Easy Apply</span> : null}
                {isNew ? <span className="inline-flex items-center gap-1 rounded-xl bg-[var(--danger-subtle)] px-3 py-1 text-caption text-[var(--danger)] wg-new-badge-pulse"><Sparkles className="h-3.5 w-3.5" /> New</span> : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {job.matchedSkills.slice(0, 3).map((s) => (
                    <span key={s} className="rounded-xl bg-[var(--info-subtle)] px-3 py-1 text-caption text-[var(--info)]">{s}</span>
                  ))}
                  {job.matchedSkills.length > 3 ? <span className="rounded-xl bg-[var(--info-subtle)] px-3 py-1 text-caption text-[var(--info)]">+{job.matchedSkills.length - 3} more</span> : null}
                  <span className="rounded-xl bg-[var(--warning-subtle)] px-3 py-1 text-caption text-[var(--warning)]">Missing: AWS, Docker</span>
                </div>
                <div className="flex items-center gap-2">
                  <ResumeIntelligenceDialog
                    jobId={job.id}
                    jobTitle={job.title}
                    company={job.company}
                    jobDescription={job.description?.trim() || job.matchLabel || job.title}
                    hasResume={hasResume}
                  />
                  {canApply ? (
                    <a
                      href={applyHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex h-9 items-center gap-2 rounded-[18px] bg-[var(--info)] px-5 text-body font-medium text-white transition hover:scale-[1.02] hover:bg-[var(--info-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--info)] focus-visible:ring-offset-2"
                    >
                      <Zap className="h-4 w-4" />
                      Quick Apply
                    </a>
                  ) : null}
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedJobId((prev) => (prev === job.id ? null : job.id));
                    }}
                    className="text-body font-medium text-[var(--info)] opacity-0 transition group-hover:opacity-100"
                  >
                    View Details
                  </Button>
                </div>
              </div>

              {isExpanded ? (
                <div className="mt-4 space-y-3 border-t border-[var(--border-default)] pt-4">
                  <div className="max-h-[200px] overflow-auto text-body leading-6 text-[var(--text-secondary)]">
                    {job.description?.trim() ? job.description : job.matchLabel}
                  </div>
                  <ul className="space-y-1 text-body">
                    {reqs.map((r) => (
                      <li key={r.label} className="flex items-center gap-2">
                        {r.status === "ok" ? (
                          <Check className="h-4 w-4 text-[var(--success)]" />
                        ) : r.status === "warn" ? (
                          <TriangleAlert className="h-4 w-4 text-[var(--warning)]" />
                        ) : (
                          <X className="h-4 w-4 text-[var(--danger)]" />
                        )}
                        <span className="text-[var(--text-secondary)]">{r.label}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-3 text-caption text-[var(--text-tertiary)]">
                    {meta.companySize ? <span>Company size: {meta.companySize}</span> : null}
                    {meta.industries.length > 0 ? <span>Industry: {meta.industries.join(", ")}</span> : null}
                    {meta.benefits.length > 0 ? <span>Benefits: {meta.benefits.join(", ")}</span> : null}
                    {meta.hasVisaSponsorship ? <span>Visa sponsorship available</span> : null}
                    <span className="inline-flex items-center gap-2"><Star className="h-3.5 w-3.5 text-[var(--warning)]" /> 4.2</span>
                    <a href="#" onClick={(e) => e.preventDefault()} className="text-[var(--info)]">View company</a>
                  </div>
                  {canApply ? (
                    <a
                      href={applyHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--info)] px-4 py-3 text-body font-medium text-white transition hover:bg-[var(--info-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--info)] focus-visible:ring-offset-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Apply Now
                    </a>
                  ) : null}
                  <ResumeIntelligenceDialog
                    jobId={job.id}
                    jobTitle={job.title}
                    company={job.company}
                    jobDescription={job.description?.trim() || job.matchLabel || job.title}
                    hasResume={hasResume}
                    triggerClassName="w-full"
                  />
                </div>
              ) : null}

              {viewMode === "grid" ? (
                <div className="mt-auto pt-4">
                  <div className="mb-3 border-t border-[var(--border-default)]" />
                  <div className="flex items-center justify-between">
                    <span className="text-caption text-[var(--text-tertiary)]">Posted {job.postedAgo}</span>
                    {canApply ? (
                      <a href={applyHref} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-2 rounded-[18px] bg-[var(--info)] px-3 py-2 text-caption font-medium text-white transition hover:bg-[var(--info-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--info)] focus-visible:ring-offset-2">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Apply
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}
              </CardContent>
            </Card>
          );
        })
        }
      </div>
      </div>
      )}

      {totalMatched > 0 ? (
        <nav
          className="mt-6 flex flex-col items-center gap-3 border-t border-[var(--border-default)] pt-5"
          aria-label="Job results pagination"
        >
          <p className="text-body text-[var(--text-tertiary)]">
            Showing {rangeStart}-{rangeEnd} of {totalMatched.toLocaleString()} jobs
          </p>
          {totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-center gap-1">
              <IconButton
                type="button"
                variant="secondary"
                iconSize="sm"
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage <= 1 || isPageLoading}
                label="Previous page"
                className="h-9 w-9 rounded-full"
                icon={<ChevronLeft className="h-4 w-4" />}
              />
              {paginationTokens.map((token, index) =>
                token === "ellipsis" ? (
                  <span key={`ellipsis-${index}`} className="px-1 text-body text-[var(--text-tertiary)]">
                    …
                  </span>
                ) : (
                  <Button
                    key={token}
                    type="button"
                    variant={token === safePage ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => goToPage(token)}
                    disabled={isPageLoading}
                    aria-label={`Page ${token}`}
                    aria-current={token === safePage ? "page" : undefined}
                    className={cn(
                      "h-9 min-w-9 rounded-full px-3 text-body font-medium",
                      token !== safePage && "hover:border-[var(--info)] hover:bg-[var(--info-subtle)]",
                    )}
                  >
                    {token}
                  </Button>
                )
              )}
              <IconButton
                type="button"
                variant="secondary"
                iconSize="sm"
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage >= totalPages || isPageLoading}
                label="Next page"
                className="h-9 w-9 rounded-full"
                icon={<ChevronRight className="h-4 w-4" />}
              />
            </div>
          ) : null}
        </nav>
      ) : null}

      {!showSkeleton &&
      listingPipeline.length === 0 &&
      !userFiltersActive &&
      showProfileMatchesOnly &&
      (liveListings > 0 || pageJobs.length > 0) ? (
        <div className="rounded-xl border border-[var(--border-default)] bg-surface-primary px-6 py-10 text-center">
          <UserSearch className="mx-auto h-20 w-20 text-[var(--info)]" />
          <h3 className="mt-4 text-heading-m text-[var(--text-primary)]">No profile matches on this page</h3>
          <p className="mt-2 text-body text-[var(--text-tertiary)]">
            {liveListings.toLocaleString()} jobs are indexed, but none on this page overlap your skills. Browse the full
            catalog or update your profile skills.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setShowProfileMatchesOnly(false);
                setSkillsPick(new Set());
                setCurrentPage(1);
              }}
              className="rounded-full"
            >
              Browse all {liveListings.toLocaleString()} jobs
            </Button>
            <Link
              href="/profile?view=profile"
              className="inline-flex h-10 items-center rounded-full border border-[var(--info)] px-5 text-body font-medium text-[var(--info)]"
            >
              Update profile skills
            </Link>
          </div>
        </div>
      ) : null}

      {!showSkeleton && listingPipeline.length === 0 && userFiltersActive && skillHints.length > 0 ? (
        <div className="rounded-xl border border-[var(--border-default)] bg-surface-primary px-6 py-10 text-center">
          <SearchX className="mx-auto h-20 w-20 text-[var(--border-default)]" />
          <h3 className="mt-4 text-heading-m text-[var(--text-primary)]">No jobs found</h3>
          <p className="mt-2 text-body text-[var(--text-tertiary)]">Try adjusting your filters or search terms</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={clearFilters}
              className="rounded-full"
            >
              Clear all filters
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={() => {
                clearFilters();
                setCurrentPage(1);
              }}
            >
              Browse all jobs
            </Button>
          </div>
        </div>
      ) : null}

      {!showSkeleton && listingPipeline.length === 0 && userFiltersActive && skillHints.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-default)] bg-surface-primary px-6 py-10 text-center">
          <UserSearch className="mx-auto h-20 w-20 text-[var(--info)]" />
          <h3 className="mt-4 text-heading-m text-[var(--text-primary)]">Complete your profile to see matches</h3>
          <div className="mx-auto mt-3 max-w-xs">
            <div className="mb-1 flex items-center justify-between text-caption text-[var(--text-tertiary)]">
              <span>Profile progress</span>
              <span>78% complete</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--info-subtle)]">
              <div className="h-full w-[78%] bg-[var(--info)]" />
            </div>
          </div>
          <div className="mx-auto mt-4 flex max-w-sm flex-col items-start gap-2 text-body">
            <Link href="/create-profile#skills" className="inline-flex items-center gap-1 text-[var(--info)]">Add your skills <ArrowRight className="h-3.5 w-3.5" /></Link>
            <Link href="/create-profile#salary" className="inline-flex items-center gap-1 text-[var(--info)]">Add expected salary <ArrowRight className="h-3.5 w-3.5" /></Link>
            <Link href="/create-profile#location" className="inline-flex items-center gap-1 text-[var(--info)]">Add location preference <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <Link
            href="/create-profile"
            className="mt-5 inline-flex h-10 items-center rounded-full bg-[var(--info)] px-5 text-body font-medium text-white hover:bg-[var(--info-foreground)]"
          >
            Complete Profile
          </Link>
        </div>
      ) : null}
      </div>

      <aside className="hidden space-y-4 lg:sticky lg:top-[var(--sticky-aside-top)] lg:block">
        <section className="rounded-xl border border-[var(--border-default)] bg-surface-primary px-4 py-4">
          <h3 className="text-body-lg font-semibold text-[var(--text-primary)]">Your Match Profile</h3>
          <p className="mt-1 text-caption text-[var(--text-tertiary)]">Based on your profile and preferences</p>
          <div className="mt-3 space-y-2">
            {matchBreakdown.map((item) => (
              <div key={`side-${item.label}`}>
                <div className="mb-1 flex items-center justify-between text-caption text-[var(--text-secondary)]">
                  <span>{item.label}</span>
                  <span>{item.score}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--info-subtle)]">
                  <div className="h-full rounded-full" style={{ width: `${item.score}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-[var(--border-default)] bg-surface-primary px-4 py-4">
          <h3 className="text-body font-semibold text-[var(--text-primary)]">Job Alerts</h3>
          <p className="mt-1 text-caption text-[var(--text-tertiary)]">Active Alerts</p>
          <div className="mt-3 space-y-2 text-caption">
            <div className="rounded-lg bg-[var(--surface-secondary)] px-3 py-2 text-[var(--text-secondary)]">Senior React Engineer - Daily digest</div>
            <div className="rounded-lg bg-[var(--surface-secondary)] px-3 py-2 text-[var(--text-secondary)]">Remote TypeScript Roles - Weekly</div>
          </div>
        </section>
      </aside>
      </div>

      <p className="rounded-2xl border border-border bg-surface-secondary/80 px-4 py-3 text-center text-caption leading-relaxed text-foreground/80">
        Ingest jobs with{" "}
        <code className="rounded bg-surface-primary px-1 py-1 font-mono text-caption text-foreground">job_aggregator</code> using the
        same <code className="rounded bg-surface-primary px-1 py-1 font-mono text-caption">DATABASE_URL</code> as Supabase.{" "}
        <Link
          href="/create-profile"
          className="font-semibold text-primary underline decoration-primary/30 underline-offset-2 hover:text-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Refresh resume
        </Link>{" "}
        to tune keyword overlap ranking.
      </p>

      {mobileDetailJobId ? (
        <div className="fixed inset-0 z-[125] bg-surface-primary p-4 md:hidden">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-body-lg font-semibold text-[var(--text-primary)]">Job Details</h3>
            <IconButton
              type="button"
              variant="ghost"
              iconSize="md"
              onClick={() => setMobileDetailJobId(null)}
              label="Close job details"
              icon={<X className="h-5 w-5 text-[var(--text-secondary)]" />}
            />
          </div>
          {(() => {
            const jobEntry = listingPipeline.find(({ job }) => job.id === mobileDetailJobId);
            if (!jobEntry) return <p className="text-body text-[var(--text-tertiary)]">Job not available.</p>;
            const { job, meta } = jobEntry;
            return (
              <div className="space-y-3">
                <h4 className="text-heading-s text-[var(--text-primary)]">{job.title}</h4>
                <p className="text-body text-[var(--text-secondary)]">{job.company}</p>
                <p className="text-body text-[var(--text-tertiary)]">
                  {job.location}
                  {meta.jobTypes[0] ? ` · ${meta.jobTypes[0]}` : ""}
                </p>
                <p className="max-h-[45vh] overflow-auto text-body leading-6 text-[var(--text-secondary)]">
                  {job.description?.trim() ? job.description : job.matchLabel}
                </p>
                {job.applyUrl ? (
                  <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--info)] px-4 py-3 text-body font-medium text-white transition hover:bg-[var(--info-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--info)] focus-visible:ring-offset-2">
                    <ExternalLink className="h-4 w-4" />
                    Apply Now
                  </a>
                ) : null}
                <ResumeIntelligenceDialog
                  jobId={job.id}
                  jobTitle={job.title}
                  company={job.company}
                  jobDescription={job.description?.trim() || job.matchLabel || job.title}
                  hasResume={hasResume}
                  triggerClassName="w-full"
                />
              </div>
            );
          })()}
        </div>
      ) : null}

      {showScrollTop ? (
        <IconButton
          type="button"
          variant="secondary"
          iconSize="lg"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-[110] h-12 w-12 rounded-full hover:shadow-md"
          label="Scroll to top"
          icon={<ArrowUp className="h-5 w-5" />}
        />
      ) : null}
    </section>
  );
}
