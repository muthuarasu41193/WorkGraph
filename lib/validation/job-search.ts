import { z } from "zod";

import { LIMITS, commaList } from "./primitives";

/** Keep in sync with `LIVE_JOBS_*` in lib/jobs-catalog.ts */
const LIVE_JOBS_MAX_API_PAGE_SIZE = 200;
const LIVE_JOBS_CLIENT_FILTER_CAP = 4000;

export const dateWindowSchema = z.enum(["any", "1", "7", "30"]);
export const catalogLocationModeSchema = z.enum(["remote", "hybrid", "onsite"]);

type JobsCatalogFilters = {
  q?: string;
  sources?: string[];
  dateWindow?: "any" | "1" | "7" | "30";
  locationMode?: "any" | "remote" | "hybrid" | "onsite";
  locationQuery?: string;
  company?: string;
  jobTypes?: string[];
};

function clampString(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, max);
  return trimmed || undefined;
}

function parsePage(value: unknown, fallback: number): number {
  const n = Number(value ?? fallback);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.trunc(n), 10_000);
}

const jobSearchRawSchema = z.object({
  q: z.preprocess((v) => clampString(v, LIMITS.query), z.string().optional()),
  src: z.preprocess((v) => clampString(v, 500), z.string().optional()),
  date: z.preprocess((value) => {
    const parsed = dateWindowSchema.safeParse(value);
    return parsed.success ? parsed.data : undefined;
  }, dateWindowSchema.optional()),
  locMode: z.preprocess((value) => {
    const parsed = catalogLocationModeSchema.safeParse(value);
    return parsed.success ? parsed.data : undefined;
  }, catalogLocationModeSchema.optional()),
  loc: z.preprocess((v) => clampString(v, LIMITS.location), z.string().optional()),
  company: z.preprocess((v) => clampString(v, LIMITS.company), z.string().optional()),
  type: z.preprocess((v) => clampString(v, 400), z.string().optional()),
  profile_skills: z.preprocess((v) => clampString(v, 4000), z.string().optional()),
  skills: z.preprocess((v) => clampString(v, 4000), z.string().optional()),
  profile_headline: z.preprocess((v) => clampString(v, LIMITS.headline), z.string().optional()),
  profile_summary: z.preprocess((v) => clampString(v, 2000), z.string().optional()),
  page: z.preprocess((v) => parsePage(v, 1), z.number().int()),
  page_size: z.preprocess((v) => parsePage(v, 100), z.number().int()),
  rank_profile: z.preprocess((v) => clampString(v, 16), z.string().optional()),
  catalog: z.preprocess((v) => clampString(v, 8), z.string().optional()),
});

export type ParsedJobSearchQuery = {
  q?: string;
  sources: string[];
  dateWindow?: JobsCatalogFilters["dateWindow"];
  locationMode?: JobsCatalogFilters["locationMode"];
  locationQuery?: string;
  company?: string;
  jobTypes: string[];
  profileSkills: string[];
  profileHeadline: string | null;
  profileSummary: string | null;
  page: number;
  pageSize: number;
  rankByProfile: boolean;
  clientCatalog: boolean;
  filters?: JobsCatalogFilters;
};

export function parseJobSearchQuery(searchParams: URLSearchParams): ParsedJobSearchQuery {
  const raw = {
    q: searchParams.get("q") ?? undefined,
    src: searchParams.get("src") ?? undefined,
    date: searchParams.get("date") ?? undefined,
    locMode: searchParams.get("locMode") ?? undefined,
    loc: searchParams.get("loc") ?? undefined,
    company: searchParams.get("company") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    profile_skills: searchParams.get("profile_skills") ?? undefined,
    skills: searchParams.get("skills") ?? undefined,
    profile_headline: searchParams.get("profile_headline") ?? undefined,
    profile_summary: searchParams.get("profile_summary") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    page_size: searchParams.get("page_size") ?? undefined,
    rank_profile: searchParams.get("rank_profile") ?? undefined,
    catalog: searchParams.get("catalog") ?? undefined,
  };

  const parsed = jobSearchRawSchema.parse(raw);
  const profileSkills = commaList(parsed.profile_skills ?? parsed.skills, LIMITS.skills, LIMITS.skill);
  const rankByProfile = parsed.rank_profile !== "0" && parsed.rank_profile !== "false";
  const pageSizeCap = rankByProfile ? LIVE_JOBS_MAX_API_PAGE_SIZE : LIVE_JOBS_CLIENT_FILTER_CAP;
  const page = parsed.page ?? 1;
  const pageSize = Math.min(pageSizeCap, parsed.page_size ?? 100);
  const clientCatalog = parsed.catalog === "1";
  const sources = commaList(parsed.src, 40, 40);
  const jobTypes = commaList(parsed.type, 12, 40);

  const filters: JobsCatalogFilters | undefined = clientCatalog
    ? undefined
    : {
        q: parsed.q || undefined,
        sources: sources.length ? sources : undefined,
        dateWindow: parsed.date,
        locationMode: parsed.locMode,
        locationQuery: parsed.loc || undefined,
        company: parsed.company || undefined,
        jobTypes: jobTypes.length ? jobTypes : undefined,
      };

  return {
    q: parsed.q || undefined,
    sources,
    dateWindow: parsed.date,
    locationMode: parsed.locMode,
    locationQuery: parsed.loc || undefined,
    company: parsed.company || undefined,
    jobTypes,
    profileSkills,
    profileHeadline: parsed.profile_headline?.trim() || null,
    profileSummary: parsed.profile_summary?.trim()?.slice(0, 2000) || null,
    page,
    pageSize,
    rankByProfile,
    clientCatalog,
    filters,
  };
}
