/**
 * Client-safe job catalog helpers (no next/cache). Used by the jobs API route,
 * profile dashboard server loader, and browser-side catalog fetch on the Jobs tab.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CommunityJobClassification,
  JobCardKind,
  JobFeedSource,
  JobRow,
  RecommendedJobCard,
} from "./job-dashboard";
import {
  buildMatchLabelFromScore,
  rankJobRows,
  scoreJobRow,
  type ProfileMatchInput,
} from "./job-match";
import {
  fetchLiveHiringSignalJobCards,
  mergeHiringSignalJobCards,
} from "./employer/hiring-signal-jobs";

export type { JobRow };

const JOB_SELECT_COLUMNS =
  "id, external_id, title, company, location, description, apply_url, posted_at, source, kind, classification, is_community";

/** PostgREST page size — fetch live listings in batches for the jobs board. */
export const LIVE_JOBS_FETCH_PAGE_SIZE = 1000;

/** Max rows returned per normal API page (ranked browse). */
export const LIVE_JOBS_MAX_API_PAGE_SIZE = 200;

/** Max rows loaded when the Jobs tab filters client-side over a catalog pool. */
export const LIVE_JOBS_CLIENT_FILTER_CAP = 4000;

function formatPostedAgo(iso: string | null): string {
  if (!iso) return "Listed recently";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Listed recently";
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

function normalizeSource(raw: string): JobFeedSource {
  const s = raw.toLowerCase().trim();
  if (
    s === "greenhouse" ||
    s === "lever" ||
    s === "adzuna" ||
    s === "usajobs" ||
    s === "ashby" ||
    s === "workday" ||
    s === "smartrecruiters" ||
    s === "jobvite" ||
    s === "bamboohr" ||
    s === "icims" ||
    s === "taleo" ||
    s === "remoteok" ||
    s === "remotejobs" ||
    s === "hackernews" ||
    s === "jobicy" ||
    s === "arbeitnow"
  ) {
    return s;
  }
  if (s === "linkedin" || s === "reddit" || s === "x" || s === "twitter" || s === "indeed" || s === "glassdoor" || s === "levels" || s === "facebook") {
    return s === "twitter" ? "x" : s;
  }
  if (s === "workgraph") return "workgraph";
  return "other";
}

function normalizeKind(raw: string | null | undefined): JobCardKind {
  return raw === "post" ? "post" : "listing";
}

function normalizeClassification(raw: string | null | undefined): CommunityJobClassification {
  switch (raw) {
    case "candidate_for_hire":
    case "freelance":
    case "internship":
    case "remote":
    case "discussion_only":
      return raw;
    case "employer_hiring":
    default:
      return "employer_hiring";
  }
}

function classificationLabel(value: CommunityJobClassification): string {
  switch (value) {
    case "candidate_for_hire":
      return "Candidate for hire";
    case "freelance":
      return "Freelance";
    case "internship":
      return "Internship";
    case "remote":
      return "Remote";
    case "discussion_only":
      return "Discussion only";
    case "employer_hiring":
    default:
      return "Employer hiring";
  }
}

function profileFromSkills(
  skills: string[],
  extras?: { headline?: string | null; summary?: string | null }
): ProfileMatchInput {
  return {
    skills,
    headline: extras?.headline,
    summary: extras?.summary,
  };
}

function buildMatchLabel(
  row: JobRow,
  skills: string[],
  profile?: ProfileMatchInput
): string {
  const scored = scoreJobRow(row, profile ?? profileFromSkills(skills));
  if (row.is_community) {
    const source = normalizeSource(row.source);
    if (scored.matchedSkills.length > 0) {
      return `${scored.matchPercent}% match · ${normalizeKind(row.kind) === "post" ? "Community post" : "Community listing"} · ${source}`;
    }
    return `${normalizeKind(row.kind) === "post" ? "Community post" : "Community listing"} · ${classificationLabel(normalizeClassification(row.classification))} · via ${source}`;
  }
  return buildMatchLabelFromScore(row, scored, skills);
}

export function mapJobRowToCard(
  row: JobRow,
  skills: string[] = [],
  profile?: ProfileMatchInput
): RecommendedJobCard {
  const matchProfile = profile ?? profileFromSkills(skills);
  const scored = scoreJobRow(row, matchProfile);
  return {
    id: row.external_id || String(row.id),
    title: row.title || "Role",
    company: row.company || "Company",
    location: row.location || "Location TBD",
    description: row.description || "",
    source: normalizeSource(row.source),
    matchLabel: buildMatchLabel(row, skills, matchProfile),
    postedAgo: formatPostedAgo(row.posted_at),
    postedAtIso: row.posted_at,
    kind: normalizeKind(row.kind),
    classification: normalizeClassification(row.classification),
    isCommunity: Boolean(row.is_community),
    matchedSkills: scored.matchedSkills,
    applyUrl: row.apply_url,
  };
}

export type JobsCatalogFilters = {
  q?: string;
  sources?: string[];
  dateWindow?: "any" | "1" | "7" | "30";
  locationMode?: "any" | "remote" | "hybrid" | "onsite";
  locationQuery?: string;
  company?: string;
  /** e.g. Full-time, Contract — matched via title/description ilike */
  jobTypes?: string[];
};

/** Hyphenated keywords only — PostgREST `.or()` treats commas/spaces as delimiters. */
const JOB_TYPE_DB_KEYWORDS: Record<string, string[]> = {
  "Full-time": ["full-time", "fulltime"],
  "Part-time": ["part-time", "parttime"],
  Contract: ["contract", "contractor"],
  Freelance: ["freelance", "freelancer"],
  Internship: ["internship", "intern"],
  Temporary: ["temporary", "temp-to-hire"],
};

export type LiveJobsPageResult = {
  rows: JobRow[] | null;
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  filtered: boolean;
};

function sanitizeIlike(value: string): string {
  return value.replace(/[%_,]/g, " ").trim();
}

/** PostgREST `.or()` values with `%` must be quoted when passed in the filter string. */
function ilikePattern(value: string): string {
  const sanitized = sanitizeIlike(value);
  const pattern = `%${sanitized}%`;
  return `"${pattern.replace(/"/g, "")}"`;
}

function orIlike(columns: string[], rawValue: string): string {
  const pattern = ilikePattern(rawValue);
  return columns.map((col) => `${col}.ilike.${pattern}`).join(",");
}

function postedAtCutoff(dateWindow: JobsCatalogFilters["dateWindow"]): string | null {
  if (!dateWindow || dateWindow === "any") return null;
  const days = Number(dateWindow);
  if (!Number.isFinite(days) || days <= 0) return null;
  return new Date(Date.now() - days * 86400000).toISOString();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyJobsCatalogFilters(builder: any, filters?: JobsCatalogFilters) {
  if (!filters) return builder;

  if (filters.sources && filters.sources.length > 0) {
    builder = builder.in("source", filters.sources);
  }

  const company = filters.company?.trim();
  if (company) {
    builder = builder.ilike("company", `%${sanitizeIlike(company)}%`);
  }

  const locationQuery = filters.locationQuery?.trim();
  if (locationQuery) {
    builder = builder.or(orIlike(["location", "description"], locationQuery));
  }

  if (filters.locationMode && filters.locationMode !== "any") {
    if (filters.locationMode === "remote") {
      builder = builder.or(
        'location.ilike."%remote%",description.ilike."%remote%",description.ilike."%wfh%",description.ilike."%distributed%"'
      );
    } else if (filters.locationMode === "hybrid") {
      builder = builder.or('location.ilike."%hybrid%",description.ilike."%hybrid%"');
    } else if (filters.locationMode === "onsite") {
      builder = builder
        .not("location", "ilike", "%remote%")
        .not("description", "ilike", "%remote%")
        .not("description", "ilike", "%wfh%")
        .not("description", "ilike", "%hybrid%")
        .neq("location", "")
        .neq("location", "Location TBD");
    }
  }

  if (filters.jobTypes && filters.jobTypes.length > 0) {
    const orParts: string[] = [];
    for (const jobType of filters.jobTypes) {
      const keywords = JOB_TYPE_DB_KEYWORDS[jobType] ?? [jobType.toLowerCase()];
      for (const keyword of keywords) {
        const pattern = ilikePattern(keyword);
        orParts.push(`title.ilike.${pattern}`, `description.ilike.${pattern}`);
      }
    }
    if (orParts.length > 0) {
      builder = builder.or(orParts.join(","));
    }
  }

  const cutoff = postedAtCutoff(filters.dateWindow);
  if (cutoff) {
    builder = builder.gte("posted_at", cutoff);
  }

  const q = filters.q?.trim();
  if (q) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    for (const term of terms) {
      builder = builder.or(
        orIlike(["title", "company", "description", "location"], term)
      );
    }
  }

  return builder;
}

export function hasActiveCatalogFilters(filters?: JobsCatalogFilters): boolean {
  if (!filters) return false;
  return Boolean(
    filters.q?.trim() ||
      (filters.sources && filters.sources.length > 0) ||
      (filters.dateWindow && filters.dateWindow !== "any") ||
      (filters.locationMode && filters.locationMode !== "any") ||
      filters.locationQuery?.trim() ||
      filters.company?.trim() ||
      (filters.jobTypes && filters.jobTypes.length > 0)
  );
}

/** Single page of live listings — used by the Jobs tab API (fast, no bulk download). */
export async function fetchLiveJobsPage(
  supabase: SupabaseClient,
  options: {
    page?: number;
    pageSize?: number;
    filters?: JobsCatalogFilters;
    /** Upper bound for pageSize (default 200; use LIVE_JOBS_CLIENT_FILTER_CAP for bulk). */
    pageSizeCap?: number;
  }
): Promise<LiveJobsPageResult> {
  const page = Math.max(1, options.page ?? 1);
  const cap = options.pageSizeCap ?? LIVE_JOBS_MAX_API_PAGE_SIZE;
  const pageSize = Math.min(cap, Math.max(1, options.pageSize ?? 100));
  const offset = (page - 1) * pageSize;
  const filters = options.filters;
  const filtered = hasActiveCatalogFilters(filters);

  let countQuery = supabase.from("jobs").select("id", { count: "exact", head: true }).eq("is_community", false);
  countQuery = applyJobsCatalogFilters(countQuery, filters);
  const totalRes = await countQuery;

  let total = totalRes.count ?? 0;
  if (totalRes.error) {
    console.warn(
      "[jobs-catalog] jobs count error:",
      totalRes.error.message ?? String(totalRes.error),
      totalRes.error.code
    );
    total = -1;
  }

  if (total === 0 && !totalRes.error) {
    return { rows: [], total: 0, page, pageSize, hasMore: false, filtered };
  }

  let dataQuery = supabase.from("jobs").select(JOB_SELECT_COLUMNS).eq("is_community", false);
  dataQuery = applyJobsCatalogFilters(dataQuery, filters);
  const { data, error } = await dataQuery
    .order("posted_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.warn("[jobs-catalog] jobs page select error:", error.message, error.code);
    return { rows: null, total, page, pageSize, hasMore: false, filtered };
  }

  const rows = (data ?? []) as JobRow[];
  const resolvedTotal = total >= 0 ? total : offset + rows.length + (rows.length === pageSize ? pageSize : 0);
  return {
    rows,
    total: resolvedTotal,
    page,
    pageSize,
    hasMore: total < 0 ? rows.length === pageSize : offset + rows.length < total,
    filtered,
  };
}

const PROFILE_RANK_CANDIDATE_CAP = 5000;
const PROFILE_RANK_FILTERED_CAP = 2500;

async function attachHiringSignalCards(
  supabase: SupabaseClient,
  profile: ProfileMatchInput,
  jobs: RecommendedJobCard[] | null,
  total: number,
): Promise<{ jobs: RecommendedJobCard[] | null; total: number }> {
  const signals = await fetchLiveHiringSignalJobCards(supabase, profile);
  if (jobs === null) {
    if (signals.length === 0) return { jobs: null, total };
    return { jobs: signals, total: signals.length };
  }
  if (signals.length === 0) return { jobs, total };
  return {
    jobs: mergeHiringSignalJobCards(jobs, signals, profile),
    total: total + signals.length,
  };
}

export async function loadLiveJobCardsPage(
  supabase: SupabaseClient,
  profileSkills: string[] = [],
  options: {
    page?: number;
    pageSize?: number;
    filters?: JobsCatalogFilters;
    profile?: ProfileMatchInput;
    /** When false, return rows ordered by posted_at (used before client-side filtering). */
    rankByProfile?: boolean;
  }
): Promise<{
  jobs: RecommendedJobCard[] | null;
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  filtered: boolean;
  ranked?: boolean;
}> {
  const page = Math.max(1, options.page ?? 1);
  const filters = options.filters;
  const filtered = hasActiveCatalogFilters(filters);
  const profile =
    options.profile ??
    profileFromSkills(profileSkills, {});
  const hasSkills = profile.skills.some((s) => s.trim().length > 0);
  const rankByProfile =
    options.rankByProfile !== false && hasSkills && !filtered;

  const pageSize = Math.min(
    options.pageSizeCap ?? LIVE_JOBS_MAX_API_PAGE_SIZE,
    Math.max(1, options.pageSize ?? 100)
  );

  if (options.rankByProfile === false) {
    const wantsBulkCatalog = pageSize > LIVE_JOBS_MAX_API_PAGE_SIZE;

    if (wantsBulkCatalog && !filtered) {
      const maxRows = Math.min(pageSize, LIVE_JOBS_CLIENT_FILTER_CAP);
      const bulk = await fetchLiveJobsCatalog(supabase, { maxRows });
      if (bulk.rows === null) {
        const withSignals = await attachHiringSignalCards(supabase, profile, null, bulk.total);
        return {
          jobs: withSignals.jobs,
          total: withSignals.total,
          page: 1,
          pageSize: withSignals.jobs?.length ?? 0,
          hasMore: false,
          filtered,
          ranked: false,
        };
      }
      const cards = bulk.rows.map((row) => mapJobRowToCard(row, profile.skills, profile));
      const withSignals = await attachHiringSignalCards(supabase, profile, cards, bulk.total);
      return {
        jobs: withSignals.jobs,
        total: withSignals.total,
        page: 1,
        pageSize: withSignals.jobs?.length ?? 0,
        hasMore: withSignals.total > (withSignals.jobs?.length ?? 0),
        filtered,
        ranked: false,
      };
    }

    if (wantsBulkCatalog && filtered) {
      const maxRows = Math.min(pageSize, LIVE_JOBS_CLIENT_FILTER_CAP);
      const bulk = await fetchFilteredLiveJobsCatalog(supabase, { filters, maxRows });
      if (bulk.rows === null) {
        const withSignals = await attachHiringSignalCards(supabase, profile, null, bulk.total);
        return {
          jobs: withSignals.jobs,
          total: withSignals.total,
          page: 1,
          pageSize: withSignals.jobs?.length ?? 0,
          hasMore: false,
          filtered: bulk.filtered,
          ranked: false,
        };
      }
      const cards = bulk.rows.map((row) => mapJobRowToCard(row, profile.skills, profile));
      const withSignals = await attachHiringSignalCards(supabase, profile, cards, bulk.total);
      return {
        jobs: withSignals.jobs,
        total: withSignals.total,
        page: 1,
        pageSize: withSignals.jobs?.length ?? 0,
        hasMore: withSignals.total > (withSignals.jobs?.length ?? 0),
        filtered: bulk.filtered,
        ranked: false,
      };
    }

    const result = await fetchLiveJobsPage(supabase, { ...options, pageSize });
    if (result.rows === null) {
      const withSignals = await attachHiringSignalCards(supabase, profile, null, result.total);
      return {
        jobs: withSignals.jobs,
        total: withSignals.total,
        page: result.page,
        pageSize: result.pageSize,
        hasMore: false,
        filtered: result.filtered,
        ranked: false,
      };
    }
    const pageCards = result.rows.map((row) => mapJobRowToCard(row, profile.skills, profile));
    const withSignals = await attachHiringSignalCards(supabase, profile, pageCards, result.total);
    return {
      jobs: withSignals.jobs,
      total: withSignals.total,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
      filtered: result.filtered,
      ranked: false,
    };
  }

  if (rankByProfile) {
    let candidates: JobRow[] | null = null;
    let filteredTotal: number | null = null;

    if (filtered) {
      const batch = await fetchLiveJobsPage(supabase, {
        page: 1,
        pageSize: PROFILE_RANK_FILTERED_CAP,
        pageSizeCap: PROFILE_RANK_FILTERED_CAP,
        filters,
      });
      candidates = batch.rows;
      filteredTotal = batch.total;
    } else {
      const catalog = await fetchLiveJobsCatalog(supabase, {
        maxRows: PROFILE_RANK_CANDIDATE_CAP,
      });
      candidates = catalog.rows;
    }

    if (candidates === null) {
      const withSignals = await attachHiringSignalCards(supabase, profile, null, 0);
      return {
        jobs: withSignals.jobs,
        total: withSignals.total,
        page,
        pageSize,
        hasMore: false,
        filtered,
        ranked: true,
      };
    }

    const ranked = rankJobRows(candidates, profile);
    const offset = (page - 1) * pageSize;
    const slice = ranked.slice(offset, offset + pageSize);
    const pageCards = slice.map((row) => mapJobRowToCard(row, profile.skills, profile));
    const resultTotal = filtered && filteredTotal !== null ? filteredTotal : ranked.length;
    const withSignals = await attachHiringSignalCards(supabase, profile, pageCards, resultTotal);
    return {
      jobs: withSignals.jobs,
      total: withSignals.total,
      page,
      pageSize,
      hasMore: offset + slice.length < ranked.length,
      filtered,
      ranked: true,
    };
  }

  const result = await fetchLiveJobsPage(supabase, options);
  if (result.rows === null) {
    const withSignals = await attachHiringSignalCards(supabase, profile, null, result.total);
    return {
      jobs: withSignals.jobs,
      total: withSignals.total,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: false,
      filtered: result.filtered,
      ranked: false,
    };
  }
  const pageCards = result.rows.map((row) => mapJobRowToCard(row, profileSkills, profile));
  const withSignals = await attachHiringSignalCards(supabase, profile, pageCards, result.total);
  return {
    jobs: withSignals.jobs,
    total: withSignals.total,
    page: result.page,
    pageSize: result.pageSize,
    hasMore: result.hasMore,
    filtered: result.filtered,
    ranked: false,
  };
}

/** Paginate through all live ATS / job-board rows for the jobs page. */
export async function fetchLiveJobsCatalog(
  supabase: SupabaseClient,
  options?: { maxRows?: number }
): Promise<{ rows: JobRow[] | null; total: number }> {
  const maxRows = options?.maxRows ?? 50_000;
  const totalRes = await supabase.from("jobs").select("*", { count: "exact", head: true }).eq("is_community", false);
  if (totalRes.error) {
    console.warn("[jobs-catalog] jobs count error:", totalRes.error.message, totalRes.error.code);
    return { rows: null, total: 0 };
  }

  const total = totalRes.count ?? 0;
  if (total === 0) return { rows: [], total: 0 };

  const all: JobRow[] = [];
  let offset = 0;

  while (offset < total && all.length < maxRows) {
    const batchSize = Math.min(LIVE_JOBS_FETCH_PAGE_SIZE, maxRows - all.length, total - offset);
    const end = offset + batchSize - 1;
    const { data, error } = await supabase
      .from("jobs")
      .select(JOB_SELECT_COLUMNS)
      .eq("is_community", false)
      .order("posted_at", { ascending: false })
      .range(offset, end);

    if (error) {
      console.warn("[jobs-catalog] jobs page select error:", error.message, error.code);
      return { rows: null, total };
    }
    if (!data?.length) break;
    all.push(...(data as JobRow[]));
    offset += data.length;
    if (data.length < batchSize) break;
  }

  return { rows: all, total };
}

/** Fetch up to maxRows live jobs with server-side catalog filters (for client-side filter UI). */
export async function fetchFilteredLiveJobsCatalog(
  supabase: SupabaseClient,
  options?: { filters?: JobsCatalogFilters; maxRows?: number }
): Promise<{ rows: JobRow[] | null; total: number; filtered: boolean }> {
  const maxRows = Math.min(
    options?.maxRows ?? LIVE_JOBS_CLIENT_FILTER_CAP,
    LIVE_JOBS_CLIENT_FILTER_CAP
  );
  const filters = options?.filters;
  const filtered = hasActiveCatalogFilters(filters);

  let countQuery = supabase.from("jobs").select("*", { count: "exact", head: true }).eq("is_community", false);
  countQuery = applyJobsCatalogFilters(countQuery, filters);
  const totalRes = await countQuery;
  if (totalRes.error) {
    console.warn("[jobs-catalog] filtered jobs count error:", totalRes.error.message, totalRes.error.code);
    return { rows: null, total: 0, filtered };
  }

  const total = totalRes.count ?? 0;
  if (total === 0) return { rows: [], total: 0, filtered };

  const all: JobRow[] = [];
  let offset = 0;
  const target = Math.min(total, maxRows);

  while (offset < target && all.length < maxRows) {
    const batchSize = Math.min(LIVE_JOBS_FETCH_PAGE_SIZE, maxRows - all.length, target - offset);
    const end = offset + batchSize - 1;
    let dataQuery = supabase.from("jobs").select(JOB_SELECT_COLUMNS).eq("is_community", false);
    dataQuery = applyJobsCatalogFilters(dataQuery, filters);
    const { data, error } = await dataQuery.order("posted_at", { ascending: false }).range(offset, end);

    if (error) {
      console.warn("[jobs-catalog] filtered jobs select error:", error.message, error.code);
      return { rows: null, total, filtered };
    }
    if (!data?.length) break;
    all.push(...(data as JobRow[]));
    offset += data.length;
    if (data.length < batchSize) break;
  }

  return { rows: all, total, filtered };
}

export async function loadLiveJobCards(
  supabase: SupabaseClient,
  skills: string[] = [],
  options?: { maxRows?: number }
): Promise<{ jobs: RecommendedJobCard[] | null; total: number }> {
  const { rows, total } = await fetchLiveJobsCatalog(supabase, options);
  if (rows === null) return { jobs: null, total };
  return { jobs: rows.map((row) => mapJobRowToCard(row, skills)), total };
}
