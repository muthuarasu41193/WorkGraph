/**
 * Shared client-side job listing filters for the profile Jobs tab.
 */

import type { JobFeedSource, RecommendedJobCard } from "./job-dashboard";
import { scoreJobCard, type ProfileMatchInput } from "./job-match";

export type JobListingFilterState = {
  q: string;
  dateWindow: "any" | "1" | "7" | "30";
  sources: Set<JobFeedSource>;
  locationMode: "any" | "remote" | "hybrid" | "onsite";
  locationQuery: string;
  companyQuery: string;
  jobTypes: Set<string>;
  matchScore: "any" | "90" | "75" | "60";
  skillsPick: Set<string>;
  experienceLevel: "any" | string;
  salaryFilterActive: boolean;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  salaryPeriod: "year" | "hour";
  companySize: "any" | string;
  industries: Set<string>;
  normalizedRequiredSkills: string[];
  benefits: Set<string>;
  visaSponsorshipOnly: boolean;
  easyApplyOnly: boolean;
};

export type DerivedJobMeta = {
  searchBlob: string;
  jobTypes: string[];
  /** First inferred employment type, e.g. "Full-time" */
  primaryJobType: string | null;
  locationMode: "remote" | "hybrid" | "onsite";
  experienceLevel: string | null;
  salary: {
    minK: number;
    maxK: number;
    currency: string;
    period: "year" | "hour";
  } | null;
  companySize: string | null;
  industries: string[];
  benefits: string[];
  hasVisaSponsorship: boolean;
  isEasyApply: boolean;
};

export type EnrichedJobRow = {
  job: RecommendedJobCard;
  meta: DerivedJobMeta;
  score: number;
};

export type JobListingFilterOptions = {
  profile?: ProfileMatchInput;
  requireProfileOverlap?: boolean;
  minProfileScore?: number;
};

const JOB_TYPE_KEYWORDS: Record<string, string[]> = {
  "Full-time": ["full-time", "full time", "fulltime", "permanent", "salaried", "fte"],
  "Part-time": ["part-time", "part time", "parttime"],
  Contract: ["contract", "contractor", "contract-to-hire", "c2h", "1099"],
  Freelance: ["freelance", "freelancer", "gig"],
  Internship: ["internship", "intern", "co-op", "coop", "summer intern"],
  Temporary: ["temporary", "temp role", "temp-to-hire", "seasonal"],
};

/** Title-only hints when description omits employment type (common on ATS rows). */
const JOB_TYPE_TITLE_HINTS: Record<string, RegExp> = {
  Internship: /\b(intern|internship|co-?op)\b/i,
  Contract: /\b(contract|contractor)\b/i,
  Freelance: /\bfreelance/i,
  Temporary: /\b(temp|temporary|seasonal)\b/i,
  "Part-time": /\bpart[-\s]?time\b/i,
  "Full-time": /\bfull[-\s]?time\b/i,
};

const REMOTE_FEED_SOURCES = new Set<JobFeedSource>([
  "remoteok",
  "remotejobs",
  "jobicy",
  "arbeitnow",
]);

const REMOTE_RE =
  /\bremote\b|work from home|work-from-home|\bwfh\b|distributed team|fully remote|remote[-\s]?first|telecommute|anywhere|work remotely/i;
const HYBRID_RE = /\bhybrid\b|partially remote|flexible location|remote[-\s]?friendly|flexible work/i;
const ONSITE_RE = /\bon[- ]?site\b|\bin[- ]?office\b|\bin person\b|\bin-person\b/i;

const EXPERIENCE_KEYWORDS: Record<string, string[]> = {
  "Entry (0-2yr)": ["entry level", "entry-level", "junior", "graduate", "intern", "new grad"],
  "Mid (2-5yr)": ["mid level", "mid-level", "intermediate", "2-5 year", "3 years"],
  "Senior (5-8yr)": ["senior", "sr.", "5+ years", "5-8 year"],
  "Lead (8-12yr)": ["lead", "principal", "staff", "8+ years", "manager"],
  "Executive (12yr+)": ["executive", "director", "vp", "head of", "chief"],
};

const COMPANY_SIZE_HINTS: Record<string, string[]> = {
  "Startup (1-50)": ["startup", "early stage", "seed", "series a"],
  "Small (51-200)": ["small team", "51-200", "growing team"],
  "Medium (201-1000)": ["midsize", "mid-size", "201-1000"],
  "Large (1000+)": ["large company", "1000+"],
  "Enterprise (10K+)": ["enterprise", "10k+", "global company"],
};

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  Technology: ["software", "engineer", "developer", "saas", "ai", "platform", "data", "cloud"],
  Finance: ["finance", "fintech", "bank", "payments", "trading", "risk"],
  Healthcare: ["health", "clinical", "med", "biotech", "hospital", "pharma"],
  Marketing: ["marketing", "growth", "seo", "brand", "content", "demand gen"],
  Design: ["design", "ux", "ui", "product design", "figma"],
  Legal: ["legal", "law", "compliance", "counsel", "contract law"],
  Education: ["education", "edtech", "curriculum", "teacher", "learning"],
  Retail: ["retail", "commerce", "ecommerce", "merchant", "shopper"],
};

const BENEFIT_KEYWORDS: Record<string, string[]> = {
  Health: ["health insurance", "medical", "dental", "vision"],
  "401k": ["401k", "retirement plan"],
  Equity: ["equity", "stock option", "rsu"],
  "Remote-first": ["remote-first", "distributed team", "remote first"],
};

function safeString(value: string | null | undefined, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function safeSkills(job: RecommendedJobCard): string[] {
  return Array.isArray(job.matchedSkills) ? job.matchedSkills : [];
}

function jobHaystack(job: RecommendedJobCard): string {
  return `${safeString(job.title)} ${safeString(job.company)} ${safeString(job.location)} ${safeString(job.description)} ${safeString(job.matchLabel)} ${safeSkills(job).join(" ")}`.toLowerCase();
}

function locationBlob(job: RecommendedJobCard): string {
  return `${safeString(job.location)} ${safeString(job.title)} ${safeString(job.company)}`.toLowerCase();
}

function skillBlob(job: RecommendedJobCard): string {
  return `${safeString(job.title)} ${safeString(job.description)} ${safeSkills(job).join(" ")}`.toLowerCase();
}

function matchesLocationMode(
  job: RecommendedJobCard,
  meta: DerivedJobMeta,
  mode: "remote" | "hybrid" | "onsite"
): boolean {
  const hay = jobHaystack(job);
  const loc = safeString(job.location).trim().toLowerCase();
  const locBlob = locationBlob(job);

  if (mode === "remote") {
    if (REMOTE_FEED_SOURCES.has(job.source)) return true;
    if (job.classification === "remote") return true;
    return meta.locationMode === "remote" || REMOTE_RE.test(hay) || REMOTE_RE.test(loc) || REMOTE_RE.test(locBlob);
  }
  if (mode === "hybrid") {
    if (REMOTE_FEED_SOURCES.has(job.source)) return false;
    return meta.locationMode === "hybrid" || HYBRID_RE.test(hay) || HYBRID_RE.test(locBlob);
  }
  if (meta.locationMode === "onsite") return true;
  if (REMOTE_FEED_SOURCES.has(job.source)) return false;
  const hasRemoteSignal = REMOTE_RE.test(hay) || REMOTE_RE.test(loc);
  return (
    ONSITE_RE.test(hay) ||
    (!hasRemoteSignal && loc.length > 0 && loc !== "location tbd" && !REMOTE_RE.test(loc))
  );
}

function matchesLocationQuery(job: RecommendedJobCard, needle: string): boolean {
  const n = needle.trim().toLowerCase();
  if (!n) return true;
  const loc = safeString(job.location).toLowerCase();
  if (loc.includes(n)) return true;
  return jobHaystack(job).includes(n);
}

function matchesJobTypes(job: RecommendedJobCard, meta: DerivedJobMeta, selected: Set<string>): boolean {
  if (selected.size === 0) return true;
  const hay = jobHaystack(job);
  const title = safeString(job.title);

  if (meta.jobTypes.some((type) => selected.has(type))) return true;

  return [...selected].some((type) => {
    const titleHint = JOB_TYPE_TITLE_HINTS[type];
    if (titleHint?.test(title)) return true;
    return (JOB_TYPE_KEYWORDS[type] ?? [type.toLowerCase()]).some((kw) => hay.includes(kw));
  });
}

function matchesDateWindow(postedAtIso: string | null, dateWindow: JobListingFilterState["dateWindow"]): boolean {
  if (dateWindow === "any") return true;
  if (!postedAtIso) return false;
  const postedAt = new Date(postedAtIso).getTime();
  if (Number.isNaN(postedAt)) return false;
  const days = Number(dateWindow);
  if (!Number.isFinite(days) || days <= 0) return true;
  const cutoff = Date.now() - days * 86400000;
  return postedAt >= cutoff;
}

function matchesExperienceLevel(meta: DerivedJobMeta, level: string): boolean {
  if (meta.experienceLevel === level) return true;
  const keywords = EXPERIENCE_KEYWORDS[level] ?? [];
  return keywords.some((kw) => meta.searchBlob.includes(kw));
}

function matchesCompanySize(meta: DerivedJobMeta, companySize: string): boolean {
  if (meta.companySize === companySize) return true;
  const hints = COMPANY_SIZE_HINTS[companySize] ?? [];
  return hints.some((hint) => meta.searchBlob.includes(hint));
}

function matchesIndustries(meta: DerivedJobMeta, selected: Set<string>): boolean {
  if (selected.size === 0) return true;
  if (meta.industries.some((industry) => selected.has(industry))) return true;
  return [...selected].some((industry) =>
    (INDUSTRY_KEYWORDS[industry] ?? []).some((kw) => meta.searchBlob.includes(kw))
  );
}

function matchesBenefits(meta: DerivedJobMeta, selected: Set<string>, blob: string): boolean {
  if (selected.size === 0) return true;
  return Array.from(selected).every((benefit) => {
    if (meta.benefits.includes(benefit)) return true;
    return (BENEFIT_KEYWORDS[benefit] ?? []).some((kw) => blob.includes(kw));
  });
}

function matchesProfileOverlap(
  job: RecommendedJobCard,
  options?: JobListingFilterOptions
): boolean {
  if (!options?.requireProfileOverlap) return true;
  const skills = options.profile?.skills ?? [];
  if (skills.length === 0) return true;
  const relevance = scoreJobCard(job, options.profile ?? { skills: [] });
  const minScore = options.minProfileScore ?? 8;
  return relevance.matchedSkills.length > 0 || relevance.score >= minScore;
}

function passesClientOnlyFilters(
  job: RecommendedJobCard,
  meta: DerivedJobMeta,
  score: number,
  state: JobListingFilterState,
  options?: JobListingFilterOptions
): boolean {
  if (state.matchScore !== "any" && score < Number(state.matchScore)) return false;

  if (state.skillsPick.size > 0) {
    const blob = skillBlob(job);
    const hasAny = [...state.skillsPick].some((sk) => blob.includes(sk.toLowerCase()));
    if (!hasAny) return false;
  }

  if (state.experienceLevel !== "any" && !matchesExperienceLevel(meta, state.experienceLevel)) {
    return false;
  }

  if (state.salaryFilterActive) {
    if (!meta.salary) return false;
    if (meta.salary.currency !== state.currency) return false;
    if (meta.salary.period !== state.salaryPeriod) return false;
    if (meta.salary.maxK < state.salaryMin || meta.salary.minK > state.salaryMax) return false;
  }

  if (state.companySize !== "any" && !matchesCompanySize(meta, state.companySize)) {
    return false;
  }

  if (!matchesIndustries(meta, state.industries)) return false;

  if (state.normalizedRequiredSkills.length > 0) {
    const blob = skillBlob(job);
    if (!state.normalizedRequiredSkills.every((skill) => blob.includes(skill))) return false;
  }

  if (!matchesBenefits(meta, state.benefits, meta.searchBlob)) return false;
  if (state.visaSponsorshipOnly && !meta.hasVisaSponsorship) return false;
  if (state.easyApplyOnly && !meta.isEasyApply) return false;

  return matchesProfileOverlap(job, options);
}

function passesCatalogFilters(
  job: RecommendedJobCard,
  meta: DerivedJobMeta,
  state: JobListingFilterState
): boolean {
  const q = state.q.trim().toLowerCase();
  if (q) {
    const terms = q.split(/\s+/).filter(Boolean);
    if (!terms.every((term) => meta.searchBlob.includes(term))) return false;
  }

  if (!matchesDateWindow(job.postedAtIso, state.dateWindow)) return false;
  if (state.sources.size > 0 && !state.sources.has(job.source)) return false;
  if (!matchesLocationQuery(job, state.locationQuery)) return false;
  if (state.locationMode !== "any" && !matchesLocationMode(job, meta, state.locationMode)) return false;

  const normalizedCompanyQuery = state.companyQuery.trim().toLowerCase();
  if (normalizedCompanyQuery && !safeString(job.company).toLowerCase().includes(normalizedCompanyQuery)) {
    return false;
  }

  if (!matchesJobTypes(job, meta, state.jobTypes)) return false;
  return true;
}

export function hasClientOnlyJobFilters(state: JobListingFilterState): boolean {
  return Boolean(
    state.matchScore !== "any" ||
      state.experienceLevel !== "any" ||
      state.salaryFilterActive ||
      state.companySize !== "any" ||
      state.industries.size > 0 ||
      state.normalizedRequiredSkills.length > 0 ||
      state.benefits.size > 0 ||
      state.visaSponsorshipOnly ||
      state.easyApplyOnly ||
      state.skillsPick.size > 0
  );
}

/** True when the Jobs tab must load a bulk catalog pool and filter in the browser. */
export function needsJobClientFilterPool(
  state: JobListingFilterState,
  options?: { profileMatchesOnly?: boolean }
): boolean {
  return Boolean(hasClientOnlyJobFilters(state) || options?.profileMatchesOnly);
}

export function hasAnyUserJobFilters(
  catalogFilters: {
    q?: string;
    sources?: string[];
    dateWindow?: string;
    locationMode?: string;
    locationQuery?: string;
    company?: string;
    jobTypes?: string[];
  },
  clientState: JobListingFilterState,
  options?: { profileMatchesOnly?: boolean }
): boolean {
  return Boolean(
    catalogFilters.q?.trim() ||
      (catalogFilters.sources && catalogFilters.sources.length > 0) ||
      (catalogFilters.dateWindow && catalogFilters.dateWindow !== "any") ||
      (catalogFilters.locationMode && catalogFilters.locationMode !== "any") ||
      catalogFilters.locationQuery?.trim() ||
      catalogFilters.company?.trim() ||
      (catalogFilters.jobTypes && catalogFilters.jobTypes.length > 0) ||
      hasClientOnlyJobFilters(clientState) ||
      options?.profileMatchesOnly
  );
}

/** Filters applied only on the client (not sent to the jobs API / Postgres). */
export function applyClientOnlyJobListingFilters(
  rows: EnrichedJobRow[],
  state: JobListingFilterState,
  options?: JobListingFilterOptions
): EnrichedJobRow[] {
  return rows.filter(({ job, meta, score }) => {
    try {
      return passesClientOnlyFilters(job, meta, score, state, options);
    } catch {
      return false;
    }
  });
}

export function applyJobListingFilters(
  rows: EnrichedJobRow[],
  state: JobListingFilterState,
  options?: JobListingFilterOptions
): EnrichedJobRow[] {
  return rows.filter(({ job, meta, score }) => {
    try {
      if (!passesCatalogFilters(job, meta, state)) return false;
      return passesClientOnlyFilters(job, meta, score, state, options);
    } catch {
      return false;
    }
  });
}
