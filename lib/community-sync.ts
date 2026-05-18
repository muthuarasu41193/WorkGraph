import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const COMMUNITY_SOURCE_DEFAULTS = ["remoteok", "arbeitnow", "reddit", "hackernews"] as const;
const COMMUNITY_SOURCE_ALL = ["remoteok", "arbeitnow", "reddit", "hackernews", "jobicy"] as const;
export type CommunitySource = (typeof COMMUNITY_SOURCE_ALL)[number];
export type CommunityKind = "listing" | "post";
export type CommunityClassification =
  | "employer_hiring"
  | "candidate_for_hire"
  | "freelance"
  | "internship"
  | "remote"
  | "discussion_only";

export type CommunitySyncRow = {
  external_id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  apply_url: string;
  posted_at: string | null;
  source: CommunitySource;
  kind: CommunityKind;
  classification: CommunityClassification;
  is_community: true;
  content_hash: string;
  embedding_json: null;
  embedding_model_version: null;
};

type RedditListing = {
  data?: {
    id?: string;
    title?: string;
    selftext?: string;
    permalink?: string;
    created_utc?: number;
    link_flair_text?: string;
    author?: string;
    subreddit?: string;
  };
};

type HnHit = {
  objectID?: string;
  title?: string;
  story_title?: string;
  story_text?: string;
  comment_text?: string;
  url?: string;
  created_at?: string;
  author?: string;
  points?: number;
};

type SyncBreakdown = Record<CommunitySource, number>;

const DEFAULT_REDDIT_SUBREDDITS = [
  "forhire",
  "hiring",
  "jobbit",
  "freelance_forhire",
  "slavelabour",
  "workonline",
  "Jobs4Bitcoins",
  "gameDevClassifieds",
  "jobs",
  "careerguidance",
  "careeradvice",
  "resumes",
  "interviews",
  "cscareerquestions",
  "cscareerquestionsEU",
  "ITCareerQuestions",
  "startups",
  "entrepreneur",
  "cofounder",
  "digitalnomad",
  "remotejs",
  "remotework",
  "remotejobs",
  "designjobs",
  "webdevjobs",
  "devopsjobs",
  "sysadminjobs",
  "internships",
] as const;

const DEFAULT_REDDIT_KEYWORDS = [
  "jobs",
  "job",
  "hiring",
  "forhire",
  "freelance",
  "remote",
  "career",
  "careers",
  "internship",
  "internships",
  "contract",
  "gig",
  "recruiting",
] as const;

const DEFAULT_HN_QUERIES = [
  "Ask HN: Who is hiring?",
  "Ask HN: Who wants to be hired?",
  "Freelancer? Seeking freelancer?",
  "hiring remote engineer",
] as const;

const COMMUNITY_HTTP_HEADERS = {
  Accept: "application/json",
  "User-Agent": "WorkGraphCommunitySync/1.0",
};

function splitCsvEnv(value: string | undefined, fallback: readonly string[]): string[] {
  const raw = value?.trim();
  if (!raw) return [...fallback];
  return raw
    .replace(/\r/g, "")
    .split(/[\n,;]+/)
    .map((item) => item.trim().replace(/^r\//i, ""))
    .filter(Boolean);
}

function enabledSources(): CommunitySource[] {
  const sourceSet = new Set(
    splitCsvEnv(process.env.COMMUNITY_ENABLED_SOURCES, COMMUNITY_SOURCE_DEFAULTS).map((item) => item.toLowerCase())
  );
  return COMMUNITY_SOURCE_ALL.filter((source) => sourceSet.has(source));
}

function asPositiveInt(value: string | undefined, fallback: number, min = 1, max = 100): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function compactText(...parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalJobText(title: string, company: string, location: string, description: string): string {
  return [title, company, location, description].map((part) => part.trim()).join("\n");
}

function sha256Hex(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function toIso(value: string | number | null | undefined): string | null {
  if (value == null) return null;
  if (typeof value === "number") {
    const maybeMs = value > 1_000_000_000_000 ? value : value * 1000;
    const date = new Date(maybeMs);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const normalized = value.trim();
  if (!normalized) return null;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeUrl(url: string): string {
  return String(url || "").trim();
}

function classificationLabel(value: CommunityClassification): string {
  switch (value) {
    case "candidate_for_hire":
      return "Candidate for hire";
    case "employer_hiring":
      return "Employer hiring";
    case "freelance":
      return "Freelance";
    case "internship":
      return "Internship";
    case "remote":
      return "Remote";
    case "discussion_only":
      return "Discussion only";
  }
}

function classifyCommunityItem(text: string, kind: CommunityKind): CommunityClassification {
  const hay = text.toLowerCase();
  if (/\b(intern|internship|new grad)\b/.test(hay)) return "internship";
  if (/\b(who wants to be hired|for hire|available for hire|candidate|seeking work|open to work)\b/.test(hay)) {
    return "candidate_for_hire";
  }
  if (/\b(freelance|contract|gig|consultant|seeking freelancer|looking for freelancer)\b/.test(hay)) {
    return "freelance";
  }
  if (/\bremote|work from home|distributed\b/.test(hay)) return "remote";
  if (/\b(hiring|job opening|position open|we are hiring|vacancy|role)\b/.test(hay)) return "employer_hiring";
  return kind === "listing" ? "employer_hiring" : "discussion_only";
}

function buildRow(input: {
  source: CommunitySource;
  externalId: string;
  title: string;
  company: string;
  location?: string;
  description?: string;
  applyUrl: string;
  postedAt?: string | null;
  kind: CommunityKind;
  classification?: CommunityClassification;
}): CommunitySyncRow | null {
  const applyUrl = normalizeUrl(input.applyUrl);
  if (!applyUrl) return null;
  const title = input.title.trim() || "Untitled role";
  const company = input.company.trim() || `Employer via ${input.source}`;
  const location = (input.location || "").trim();
  const description = stripHtml(input.description || "");
  const classification =
    input.classification || classifyCommunityItem(compactText(title, company, location, description), input.kind);
  return {
    external_id: input.externalId.trim(),
    title,
    company,
    location,
    description,
    apply_url: applyUrl,
    posted_at: input.postedAt || null,
    source: input.source,
    kind: input.kind,
    classification,
    is_community: true,
    content_hash: sha256Hex(canonicalJobText(title, company, location, description)),
    embedding_json: null,
    embedding_model_version: null,
  };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...COMMUNITY_HTTP_HEADERS,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return (await response.json()) as T;
}

async function fetchRemoteOkRows(): Promise<CommunitySyncRow[]> {
  const payload = await fetchJson<Array<Record<string, unknown>>>("https://remoteok.com/api");
  const rows: CommunitySyncRow[] = [];
  const seen = new Set<string>();
  for (const item of payload) {
    if (!item || typeof item !== "object" || !("id" in item)) continue;
    const applyUrl = normalizeUrl(String(item.apply_url || item.url || ""));
    if (!applyUrl || seen.has(applyUrl)) continue;
    const title = String(item.position || item.title || "").trim();
    const company = String(item.company || "").trim();
    const location = String(item.location || "Remote").trim();
    const tags = Array.isArray(item.tags) ? item.tags.map((tag) => String(tag).trim()).filter(Boolean).join(", ") : "";
    const salaryText =
      item.salary_min != null && item.salary_max != null
        ? `Salary: ${String(item.salary_currency || "USD")} ${String(item.salary_min)} - ${String(item.salary_max)}`
        : "";
    const row = buildRow({
      source: "remoteok",
      externalId: `remoteok:${String(item.id)}`,
      title,
      company,
      location,
      description: compactText(tags ? `Tags: ${tags}` : "", salaryText, String(item.description || "")),
      applyUrl,
      postedAt: toIso(String(item.date || "")) || toIso(Number(item.epoch || 0)) || null,
      kind: "listing",
    });
    if (!row) continue;
    rows.push(row);
    seen.add(applyUrl);
  }
  return rows;
}

async function fetchArbeitnowRows(): Promise<CommunitySyncRow[]> {
  const maxPages = asPositiveInt(process.env.COMMUNITY_ARBEITNOW_MAX_PAGES, 2, 1, 6);
  const visaOnly = /^(1|true|yes)$/i.test(process.env.COMMUNITY_ARBEITNOW_VISA_SPONSORSHIP || "");
  const rows: CommunitySyncRow[] = [];
  const seen = new Set<string>();
  let page = 0;
  let nextUrl = visaOnly
    ? "https://www.arbeitnow.com/api/job-board-api?visa_sponsorship=true"
    : "https://www.arbeitnow.com/api/job-board-api";

  while (nextUrl && page < maxPages) {
    page += 1;
    const payload = await fetchJson<{ data?: Array<Record<string, unknown>>; links?: { next?: string | null } }>(nextUrl);
    for (const item of payload.data || []) {
      const applyUrl = normalizeUrl(String(item.url || ""));
      if (!applyUrl || seen.has(applyUrl)) continue;
      const tags = Array.isArray(item.tags) ? item.tags.map((tag) => String(tag).trim()).filter(Boolean).join(", ") : "";
      const types = Array.isArray(item.job_types)
        ? item.job_types.map((tag) => String(tag).trim()).filter(Boolean).join(", ")
        : "";
      const rawLocation = Array.isArray(item.location)
        ? item.location.map((part) => String(part).trim()).filter(Boolean).join(", ")
        : String(item.location || "").trim();
      const row = buildRow({
        source: "arbeitnow",
        externalId: `arbeitnow:${String(item.slug || item.id || applyUrl)}`,
        title: String(item.title || ""),
        company: String(item.company_name || item.company || ""),
        location: item.remote === true ? "Remote" : rawLocation,
        description: compactText(
          tags ? `Tags: ${tags}` : "",
          types ? `Types: ${types}` : "",
          item.visa_sponsorship ? "Visa sponsorship available" : "",
          String(item.description || "")
        ),
        applyUrl,
        postedAt: toIso(String(item.created_at || item.published_at || "")),
        kind: "listing",
      });
      if (!row) continue;
      rows.push(row);
      seen.add(applyUrl);
    }
    nextUrl = payload.links?.next?.trim() || "";
  }

  return rows;
}

async function fetchRedditRows(): Promise<CommunitySyncRow[]> {
  const subreddits = splitCsvEnv(process.env.COMMUNITY_REDDIT_SUBREDDITS, DEFAULT_REDDIT_SUBREDDITS);
  const keywords = splitCsvEnv(process.env.COMMUNITY_REDDIT_KEYWORDS, DEFAULT_REDDIT_KEYWORDS).map((keyword) =>
    keyword.toLowerCase()
  );
  const perSubredditLimit = asPositiveInt(process.env.COMMUNITY_REDDIT_LIMIT_PER_SUBREDDIT, 20, 5, 75);
  const rows: CommunitySyncRow[] = [];
  const seen = new Set<string>();

  for (const subreddit of subreddits) {
    const payload = await fetchJson<{ data?: { children?: RedditListing[] } }>(
      `https://www.reddit.com/r/${subreddit}/new.json?limit=${perSubredditLimit}`
    );
    for (const child of payload.data?.children || []) {
      const post = child.data;
      if (!post?.id || !post.title || !post.permalink) continue;
      const textBlob = compactText(post.title, post.selftext || "", post.link_flair_text || "").toLowerCase();
      if (keywords.length > 0 && !keywords.some((keyword) => textBlob.includes(keyword))) continue;
      const applyUrl = `https://www.reddit.com${post.permalink}`;
      if (seen.has(applyUrl)) continue;
      const classification = classifyCommunityItem(textBlob, "post");
      const row = buildRow({
        source: "reddit",
        externalId: `reddit:${subreddit}:${post.id}`,
        title: post.title,
        company: `r/${post.subreddit || subreddit}`,
        location: post.link_flair_text || "Community post",
        description: compactText(
          post.selftext || "",
          post.author ? `Author: u/${post.author}` : "",
          `Classification: ${classificationLabel(classification)}`
        ),
        applyUrl,
        postedAt: toIso(post.created_utc),
        kind: "post",
        classification,
      });
      if (!row) continue;
      rows.push(row);
      seen.add(applyUrl);
    }
  }

  return rows;
}

async function fetchHackerNewsRows(): Promise<CommunitySyncRow[]> {
  const queries = splitCsvEnv(process.env.COMMUNITY_HN_QUERIES, DEFAULT_HN_QUERIES);
  const limit = asPositiveInt(process.env.COMMUNITY_HN_LIMIT, 18, 5, 50);
  const rows: CommunitySyncRow[] = [];
  const seen = new Set<string>();

  for (const query of queries) {
    const params = new URLSearchParams({
      query,
      tags: "story",
      hitsPerPage: String(limit),
    });
    const payload = await fetchJson<{ hits?: HnHit[] }>(
      `https://hn.algolia.com/api/v1/search_by_date?${params.toString()}`
    );
    for (const hit of payload.hits || []) {
      const objectId = String(hit.objectID || "").trim();
      const title = String(hit.title || hit.story_title || "").trim();
      if (!objectId || !title) continue;
      const applyUrl = normalizeUrl(hit.url || "") || `https://news.ycombinator.com/item?id=${objectId}`;
      if (seen.has(applyUrl)) continue;
      const description = compactText(
        hit.story_text || "",
        stripHtml(hit.comment_text || ""),
        hit.author ? `Author: ${hit.author}` : "",
        hit.points != null ? `Points: ${String(hit.points)}` : ""
      );
      const classification = classifyCommunityItem(compactText(title, description), "post");
      const row = buildRow({
        source: "hackernews",
        externalId: `hackernews:${objectId}`,
        title,
        company: "Hacker News",
        location: "Internet",
        description,
        applyUrl,
        postedAt: toIso(hit.created_at || ""),
        kind: "post",
        classification,
      });
      if (!row) continue;
      rows.push(row);
      seen.add(applyUrl);
    }
  }

  return rows;
}

async function fetchJobicyRows(): Promise<CommunitySyncRow[]> {
  const count = asPositiveInt(process.env.COMMUNITY_JOBICY_COUNT, 20, 1, 50);
  const payload = await fetchJson<{ jobs?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>>(
    `https://jobicy.com/api/v2/remote-jobs?count=${count}`
  );
  const jobs = Array.isArray(payload) ? payload : payload.jobs || [];
  const rows: CommunitySyncRow[] = [];
  const seen = new Set<string>();
  for (const item of jobs) {
    const applyUrl = normalizeUrl(String(item.url || ""));
    if (!applyUrl || seen.has(applyUrl)) continue;
    const description = compactText(
      item.jobIndustry ? `Industry: ${String(item.jobIndustry)}` : "",
      item.jobType ? `Type: ${String(item.jobType)}` : "",
      item.jobLevel ? `Level: ${String(item.jobLevel)}` : "",
      String(item.jobExcerpt || ""),
      String(item.jobDescription || "")
    );
    const row = buildRow({
      source: "jobicy",
      externalId: `jobicy:${String(item.id || item.slug || applyUrl)}`,
      title: String(item.jobTitle || item.title || ""),
      company: String(item.companyName || item.company || ""),
      location: String(item.jobGeo || item.jobRegion || "Remote"),
      description,
      applyUrl,
      postedAt: toIso(String(item.pubDate || item.date || "")),
      kind: "listing",
    });
    if (!row) continue;
    rows.push(row);
    seen.add(applyUrl);
  }
  return rows;
}

async function fetchSourceRows(source: CommunitySource): Promise<CommunitySyncRow[]> {
  switch (source) {
    case "remoteok":
      return fetchRemoteOkRows();
    case "arbeitnow":
      return fetchArbeitnowRows();
    case "reddit":
      return fetchRedditRows();
    case "hackernews":
      return fetchHackerNewsRows();
    case "jobicy":
      return fetchJobicyRows();
  }
}

function envOrThrow(name: "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function chunkRows<T>(rows: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

export async function syncCommunityJobsViaSupabase(): Promise<{
  enabledSources: CommunitySource[];
  fetchedRows: number;
  upsertedRows: number;
  breakdown: SyncBreakdown;
}> {
  const enabled = enabledSources();
  const breakdown = Object.fromEntries(COMMUNITY_SOURCE_ALL.map((source) => [source, 0])) as SyncBreakdown;
  const fetchedRows: CommunitySyncRow[] = [];
  const seenApplyUrls = new Set<string>();

  for (const source of enabled) {
    const rows = await fetchSourceRows(source);
    let kept = 0;
    for (const row of rows) {
      if (seenApplyUrls.has(row.apply_url)) continue;
      fetchedRows.push(row);
      seenApplyUrls.add(row.apply_url);
      kept += 1;
    }
    breakdown[source] = kept;
  }

  const supabase = createClient(envOrThrow("NEXT_PUBLIC_SUPABASE_URL"), envOrThrow("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const batch of chunkRows(fetchedRows, 100)) {
    const { error } = await supabase.from("jobs").upsert(batch, { onConflict: "apply_url", ignoreDuplicates: false });
    if (error) {
      throw new Error(`Community jobs upsert failed: ${error.message}`);
    }
  }

  return {
    enabledSources: enabled,
    fetchedRows: fetchedRows.length,
    upsertedRows: fetchedRows.length,
    breakdown,
  };
}

/** Safe for diagnostics routes: no secrets, only source list and env presence flags. */
export function getCommunitySyncDiagnosticsEnv(): {
  enabledSources: CommunitySource[];
  env: {
    hasNextPublicSupabaseUrl: boolean;
    hasServiceRoleKey: boolean;
    hasCronSecret: boolean;
  };
} {
  return {
    enabledSources: enabledSources(),
    env: {
      hasNextPublicSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
      hasCronSecret: Boolean(process.env.CRON_SECRET?.trim()),
    },
  };
}
