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

    const needle = state.locationQuery.trim().toLowerCase();
    const blob = meta.searchBlob;
    if (needle && !blob.includes(needle)) return false;
    if (state.locationMode !== "any") {
      if (meta.locationMode === state.locationMode) {
        // ok
      } else if (state.locationMode === "remote") {
        if (!/\bremote\b|work from home|\bwfh\b|distributed|anywhere|telecommute/.test(blob)) return false;
      } else if (state.locationMode === "hybrid") {
        if (!/\bhybrid\b|partially remote|flexible location/.test(blob)) return false;
      } else if (state.locationMode === "onsite") {
        const hasRemoteSignal = /\bremote\b|work from home|\bwfh\b|distributed/.test(blob);
        if (
          !(/\bon[- ]?site\b|\bin[- ]?office\b/.test(blob) ||
            (!hasRemoteSignal && Boolean(job.location.trim()) && job.location !== "Location TBD"))
        ) {
          return false;
        }
      }
    }

    if (normalizedCompanyQuery && !job.company.toLowerCase().includes(normalizedCompanyQuery)) return false;

    if (state.jobTypes.size > 0) {
      const typeHit =
        meta.jobTypes.some((type) => state.jobTypes.has(type)) ||
        [...state.jobTypes].some((type) => {
          const keywords =
            type === "Full-time"
              ? ["full-time", "full time"]
              : type === "Part-time"
                ? ["part-time", "part time"]
                : type === "Contract"
                  ? ["contract", "contractor"]
                  : type === "Freelance"
                    ? ["freelance"]
                    : type === "Internship"
                      ? ["internship", "intern"]
                      : ["temporary", "temp"];
          return keywords.some((kw) => blob.includes(kw));
        });
      if (!typeHit) return false;
    }

    if (state.matchScore !== "any" && score < Number(state.matchScore)) return false;

    if (state.skillsPick.size > 0) {
      const skillBlob = `${job.title} ${job.description} ${job.matchedSkills.join(" ")}`.toLowerCase();
      const hasAny = [...state.skillsPick].some((sk) => skillBlob.includes(sk.toLowerCase()));
      if (!hasAny) return false;
    }

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
