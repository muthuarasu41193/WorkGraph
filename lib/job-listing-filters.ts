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

function jobHaystack(job: RecommendedJobCard): string {
  return `${job.title} ${job.company} ${job.location} ${job.description} ${job.matchLabel} ${job.matchedSkills.join(" ")}`.toLowerCase();
}

function locationBlob(job: RecommendedJobCard): string {
  return `${job.location} ${job.title} ${job.company}`.toLowerCase();
}

function matchesLocationMode(
  job: RecommendedJobCard,
  meta: DerivedJobMeta,
  mode: "remote" | "hybrid" | "onsite"
): boolean {
  const hay = jobHaystack(job);
  const loc = job.location.trim().toLowerCase();
  const locBlob = locationBlob(job);

  if (mode === "remote") {
    if (REMOTE_FEED_SOURCES.has(job.source)) return true;
    if (job.classification === "remote") return true;
    return meta.locationMode === "remote" || REMOTE_RE.test(hay) || REMOTE_RE.test(loc) || REMOTE_RE.test(locBlob);
  }
  if (mode === "hybrid") {
    return meta.locationMode === "hybrid" || HYBRID_RE.test(hay) || HYBRID_RE.test(locBlob);
  }
  if (meta.locationMode === "onsite") return true;
  const hasRemoteSignal = REMOTE_RE.test(hay) || REMOTE_RE.test(loc);
  return (
    ONSITE_RE.test(hay) ||
    (!hasRemoteSignal && loc.length > 0 && loc !== "location tbd" && !REMOTE_RE.test(loc))
  );
}

function matchesLocationQuery(job: RecommendedJobCard, needle: string): boolean {
  const n = needle.trim().toLowerCase();
  if (!n) return true;
  const loc = job.location.toLowerCase();
  if (loc.includes(n)) return true;
  return jobHaystack(job).includes(n);
}

function matchesJobTypes(job: RecommendedJobCard, meta: DerivedJobMeta, selected: Set<string>): boolean {
  if (selected.size === 0) return true;
  const hay = jobHaystack(job);
  const title = job.title;

  if (meta.jobTypes.some((type) => selected.has(type))) return true;

  return [...selected].some((type) => {
    const titleHint = JOB_TYPE_TITLE_HINTS[type];
    if (titleHint?.test(title)) return true;
    return (JOB_TYPE_KEYWORDS[type] ?? [type.toLowerCase()]).some((kw) => hay.includes(kw));
  });
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
  clientState: JobListingFilterState
): boolean {
  return Boolean(
    catalogFilters.q?.trim() ||
      (catalogFilters.sources && catalogFilters.sources.length > 0) ||
      (catalogFilters.dateWindow && catalogFilters.dateWindow !== "any") ||
      (catalogFilters.locationMode && catalogFilters.locationMode !== "any") ||
      catalogFilters.locationQuery?.trim() ||
      catalogFilters.company?.trim() ||
      (catalogFilters.jobTypes && catalogFilters.jobTypes.length > 0) ||
      hasClientOnlyJobFilters(clientState)
  );
}

/** Filters applied only on the client (not sent to the jobs API / Postgres). */
export function applyClientOnlyJobListingFilters(
  rows: EnrichedJobRow[],
  state: JobListingFilterState,
  options?: {
    profile?: ProfileMatchInput;
    requireProfileOverlap?: boolean;
    minProfileScore?: number;
  }
): EnrichedJobRow[] {
  return rows.filter(({ job, meta, score }) => {
    if (state.matchScore !== "any" && score < Number(state.matchScore)) return false;

    if (state.skillsPick.size > 0) {
      const skillBlob = `${job.title} ${job.description} ${job.matchedSkills.join(" ")}`.toLowerCase();
      const hasAny = [...state.skillsPick].some((sk) => skillBlob.includes(sk.toLowerCase()));
      if (!hasAny) return false;
    }

    const blob = meta.searchBlob;
    if (state.experienceLevel !== "any" && meta.experienceLevel !== state.experienceLevel) {
      const expKeywords: Record<string, string[]> = {
        "Entry (0-2yr)": ["entry level", "entry-level", "junior", "graduate", "intern"],
        "Mid (2-5yr)": ["mid level", "mid-level", "intermediate"],
        "Senior (5-8yr)": ["senior", "sr."],
        "Lead (8-12yr)": ["lead", "principal", "staff", "manager"],
        "Executive (12yr+)": ["executive", "director", "vp", "head of", "chief"],
      };
      const keywords = expKeywords[state.experienceLevel] ?? [];
      if (!keywords.some((kw) => blob.includes(kw)) && meta.experienceLevel !== state.experienceLevel) return false;
    }

    if (state.salaryFilterActive) {
      if (!meta.salary) return false;
      if (meta.salary.currency !== state.currency) return false;
      if (meta.salary.period !== state.salaryPeriod) return false;
      if (meta.salary.maxK < state.salaryMin || meta.salary.minK > state.salaryMax) return false;
    }

    if (state.companySize !== "any" && meta.companySize !== state.companySize) {
      const sizeHint =
        state.companySize === "Startup (1-50)"
          ? ["startup", "early stage", "seed"]
          : state.companySize === "Small (51-200)"
            ? ["small team", "51-200"]
            : state.companySize === "Medium (201-1000)"
              ? ["midsize", "201-1000"]
              : state.companySize === "Large (1000+)"
                ? ["large company", "1000+"]
                : ["enterprise", "10k+"];
      if (!sizeHint.some((h) => blob.includes(h))) return false;
    }

    if (state.industries.size > 0 && !meta.industries.some((industry) => state.industries.has(industry))) {
      const industryKeywords: Record<string, string[]> = {
        Technology: ["software", "engineer", "developer", "saas", "ai"],
        Finance: ["finance", "fintech", "bank"],
        Healthcare: ["health", "clinical", "med", "biotech"],
        Marketing: ["marketing", "growth", "seo"],
        Design: ["design", "ux", "ui"],
        Legal: ["legal", "law", "compliance"],
        Education: ["education", "edtech", "learning"],
        Retail: ["retail", "commerce", "ecommerce"],
      };
      const industryHit = [...state.industries].some((industry) =>
        (industryKeywords[industry] ?? []).some((kw) => blob.includes(kw))
      );
      if (!industryHit) return false;
    }

    if (state.normalizedRequiredSkills.length > 0) {
      const skillBlob = `${job.title} ${job.description} ${job.matchedSkills.join(" ")}`.toLowerCase();
      if (!state.normalizedRequiredSkills.every((skill) => skillBlob.includes(skill))) return false;
    }

    if (state.benefits.size > 0 && !Array.from(state.benefits).every((benefit) => meta.benefits.includes(benefit))) {
      return false;
    }
    if (state.visaSponsorshipOnly && !meta.hasVisaSponsorship) return false;
    if (state.easyApplyOnly && !meta.isEasyApply) return false;

    if (options?.requireProfileOverlap && options.profile?.skills.length) {
      const relevance = scoreJobCard(job, options.profile);
      const minScore = options.minProfileScore ?? 8;
      if (relevance.matchedSkills.length === 0 && relevance.score < minScore) return false;
    }

    return true;
  });
}

export function applyJobListingFilters(
  rows: EnrichedJobRow[],
  state: JobListingFilterState,
  options?: {
    profile?: ProfileMatchInput;
    requireProfileOverlap?: boolean;
    minProfileScore?: number;
  }
): EnrichedJobRow[] {
  const q = state.q.trim().toLowerCase();
  const normalizedCompanyQuery = state.companyQuery.trim().toLowerCase();

  return rows.filter(({ job, meta, score }) => {
    if (q) {
      const terms = q.split(/\s+/).filter(Boolean);
      if (!terms.every((term) => meta.searchBlob.includes(term))) return false;
    }
    if (state.dateWindow !== "any") {
      if (!job.postedAtIso) return false;
      const days = Number(state.dateWindow);
      const cutoff = Date.now() - days * 86400000;
      if (new Date(job.postedAtIso).getTime() < cutoff) return false;
    }
    if (state.sources.size > 0 && !state.sources.has(job.source)) return false;

    if (!matchesLocationQuery(job, state.locationQuery)) return false;
    if (state.locationMode !== "any" && !matchesLocationMode(job, meta, state.locationMode)) {
      return false;
    }

    if (normalizedCompanyQuery && !job.company.toLowerCase().includes(normalizedCompanyQuery)) return false;

    if (!matchesJobTypes(job, meta, state.jobTypes)) return false;

    if (state.matchScore !== "any" && score < Number(state.matchScore)) return false;

    if (state.skillsPick.size > 0) {
      const skillBlob = `${job.title} ${job.description} ${job.matchedSkills.join(" ")}`.toLowerCase();
      const hasAny = [...state.skillsPick].some((sk) => skillBlob.includes(sk.toLowerCase()));
      if (!hasAny) return false;
    }

    const blob = meta.searchBlob;
    if (state.experienceLevel !== "any" && meta.experienceLevel !== state.experienceLevel) {
      const expKeywords: Record<string, string[]> = {
        "Entry (0-2yr)": ["entry level", "entry-level", "junior", "graduate", "intern"],
        "Mid (2-5yr)": ["mid level", "mid-level", "intermediate"],
        "Senior (5-8yr)": ["senior", "sr."],
        "Lead (8-12yr)": ["lead", "principal", "staff", "manager"],
        "Executive (12yr+)": ["executive", "director", "vp", "head of", "chief"],
      };
      const keywords = expKeywords[state.experienceLevel] ?? [];
      if (!keywords.some((kw) => blob.includes(kw)) && meta.experienceLevel !== state.experienceLevel) return false;
    }

    if (state.salaryFilterActive) {
      if (!meta.salary) return false;
      if (meta.salary.currency !== state.currency) return false;
      if (meta.salary.period !== state.salaryPeriod) return false;
      if (meta.salary.maxK < state.salaryMin || meta.salary.minK > state.salaryMax) return false;
    }

    if (state.companySize !== "any" && meta.companySize !== state.companySize) {
      const sizeHint =
        state.companySize === "Startup (1-50)"
          ? ["startup", "early stage", "seed"]
          : state.companySize === "Small (51-200)"
            ? ["small team", "51-200"]
            : state.companySize === "Medium (201-1000)"
              ? ["midsize", "201-1000"]
              : state.companySize === "Large (1000+)"
                ? ["large company", "1000+"]
                : ["enterprise", "10k+"];
      if (!sizeHint.some((h) => blob.includes(h))) return false;
    }

    if (state.industries.size > 0 && !meta.industries.some((industry) => state.industries.has(industry))) {
      const industryKeywords: Record<string, string[]> = {
        Technology: ["software", "engineer", "developer", "saas", "ai"],
        Finance: ["finance", "fintech", "bank"],
        Healthcare: ["health", "clinical", "med", "biotech"],
        Marketing: ["marketing", "growth", "seo"],
        Design: ["design", "ux", "ui"],
        Legal: ["legal", "law", "compliance"],
        Education: ["education", "edtech", "learning"],
        Retail: ["retail", "commerce", "ecommerce"],
      };
      const industryHit = [...state.industries].some((industry) =>
        (industryKeywords[industry] ?? []).some((kw) => blob.includes(kw))
      );
      if (!industryHit) return false;
    }

    if (state.normalizedRequiredSkills.length > 0) {
      const skillBlob = `${job.title} ${job.description} ${job.matchedSkills.join(" ")}`.toLowerCase();
      if (!state.normalizedRequiredSkills.every((skill) => skillBlob.includes(skill))) return false;
    }

    if (state.benefits.size > 0 && !Array.from(state.benefits).every((benefit) => meta.benefits.includes(benefit))) {
      return false;
    }
    if (state.visaSponsorshipOnly && !meta.hasVisaSponsorship) return false;
    if (state.easyApplyOnly && !meta.isEasyApply) return false;

    if (options?.requireProfileOverlap && options.profile?.skills.length) {
      const relevance = scoreJobCard(job, options.profile);
      const minScore = options.minProfileScore ?? 8;
      if (relevance.matchedSkills.length === 0 && relevance.score < minScore) return false;
    }

    return true;
  });
}
