/**
 * Profile ↔ job relevance scoring for ranked listings and match labels.
 */

import type { JobRow } from "./job-dashboard";

export type ProfileMatchInput = {
  skills: string[];
  headline?: string | null;
  summary?: string | null;
};

const SKILL_ALIASES: Record<string, string[]> = {
  javascript: ["javascript", "js", "ecmascript", "node.js", "nodejs", "node"],
  typescript: ["typescript", "ts"],
  react: ["react", "reactjs", "react.js", "react native", "react-native"],
  vue: ["vue", "vuejs", "vue.js", "nuxt"],
  angular: ["angular"],
  python: ["python", "django", "flask", "fastapi"],
  java: ["java", "spring", "spring boot", "kotlin"],
  "c#": ["c#", "csharp", ".net", "dotnet"],
  "c++": ["c++", "cpp"],
  go: ["golang", "go lang"],
  rust: ["rust"],
  ruby: ["ruby", "rails"],
  php: ["php", "laravel"],
  sql: ["sql", "postgres", "postgresql", "mysql", "bigquery", "snowflake"],
  aws: ["aws", "amazon web services", "ec2", "s3", "lambda"],
  azure: ["azure"],
  gcp: ["gcp", "google cloud"],
  kubernetes: ["kubernetes", "k8s"],
  docker: ["docker", "container"],
  terraform: ["terraform"],
  graphql: ["graphql"],
  redis: ["redis"],
  mongodb: ["mongodb", "mongo"],
  machine: ["machine learning", "ml engineer", "ml "],
  data: ["data engineer", "data scientist", "data science", "analytics"],
  devops: ["devops", "sre", "site reliability"],
  agile: ["agile", "scrum"],
  figma: ["figma"],
  salesforce: ["salesforce"],
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function skillVariants(skill: string): string[] {
  const base = normalizeWhitespace(skill);
  if (!base) return [];
  const alias = SKILL_ALIASES[base];
  const variants = new Set<string>([base, ...(alias ?? [])]);
  if (base.includes(".")) variants.add(base.replace(/\./g, ""));
  if (base.includes(" ")) {
    variants.add(base.replace(/\s+/g, ""));
    variants.add(base.replace(/\s+/g, "-"));
  }
  return [...variants].filter((v) => v.length >= 2);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function textIncludesTerm(haystack: string, term: string): boolean {
  if (!term || !haystack) return false;
  if (term.length <= 3) {
    const re = new RegExp(`\\b${escapeRegExp(term)}\\b`, "i");
    return re.test(haystack);
  }
  return haystack.includes(term);
}

export const PROFILE_MATCH_MIN_PERCENT = 40;
const STALE_AFTER_DAYS = 30;

const TITLE_FAMILIES: { id: string; terms: string[] }[] = [
  { id: "recruiting", terms: ["recruit", "talent acquisition", "talent", "sourcer", "sourcing", "talent partner", "staffing"] },
  { id: "engineering", terms: ["engineer", "developer", "sre", "devops"] },
  { id: "design", terms: ["designer"] },
  { id: "product", terms: ["product manager", "product owner"] },
  { id: "data", terms: ["data scientist", "data analyst", "data engineer"] },
  { id: "sales", terms: ["account executive", "sales"] },
  { id: "marketing", terms: ["marketing"] },
  { id: "people", terms: ["human resources", "people partner", "people operations"] },
];

const SENIORITY_TOKENS = ["junior", "senior", "staff", "principal", "lead", "chief", "director", "vp", "head"];

export type JobMatchSubScores = {
  skillOverlap: number;
  titleFamily: number;
  seniority: number;
  freshness: number;
};

export type JobMatchScore = {
  /** Rank key. Skill overlap and title family dominate; stale jobs are pushed down. */
  score: number;
  matchedSkills: string[];
  matchPercent: number;
  subScores: JobMatchSubScores;
};

function bestTitleFamily(text: string): string | null {
  let best: { id: string; hits: number } | null = null;
  for (const family of TITLE_FAMILIES) {
    const hits = family.terms.filter((term) => textIncludesTerm(text, term)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { id: family.id, hits };
  }
  return best?.id ?? null;
}

function seniorityTokens(text: string): Set<string> {
  const found = new Set<string>();
  for (const token of SENIORITY_TOKENS) {
    if (textIncludesTerm(text, token)) found.add(token);
  }
  return found;
}

function postedAgeDays(postedAt: string | null | undefined, now: number): number | null {
  if (!postedAt) return null;
  const then = new Date(postedAt).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((now - then) / 86_400_000);
}

export function scoreJobRow(row: JobRow, profile: ProfileMatchInput, now = Date.now()): JobMatchScore {
  const skills = profile.skills.map((s) => s.trim()).filter(Boolean);
  const titleHay = normalizeWhitespace(row.title ?? "");
  const descHay = normalizeWhitespace(row.description ?? "");
  const hay = `${titleHay} ${descHay}`.trim();

  const matchedSkills: string[] = [];
  let skillOverlap = 0;

  for (const skill of skills) {
    const variants = skillVariants(skill);
    let best = 0;
    for (const variant of variants) {
      if (textIncludesTerm(titleHay, variant)) best = Math.max(best, 24);
      else if (textIncludesTerm(hay, variant)) best = Math.max(best, 10);
    }
    if (best > 0) {
      skillOverlap += best;
      matchedSkills.push(skill);
    }
  }
  skillOverlap = Math.min(70, skillOverlap);

  const profileFamilyText = normalizeWhitespace([profile.headline, ...skills].filter(Boolean).join(" "));
  const profileFamily = bestTitleFamily(profileFamilyText);
  const jobFamily = bestTitleFamily(titleHay);
  const titleFamily = profileFamily && jobFamily && profileFamily === jobFamily ? 22 : 0;

  const profileSeniority = seniorityTokens(profileFamilyText);
  const jobSeniority = seniorityTokens(titleHay);
  let seniority = 0;
  for (const token of profileSeniority) {
    if (jobSeniority.has(token)) seniority = 4;
  }

  const ageDays = postedAgeDays(row.posted_at, now);
  const stale = ageDays !== null && ageDays > STALE_AFTER_DAYS;
  let freshness = 0;
  if (ageDays !== null) {
    if (stale) freshness = -40;
    else if (ageDays <= 7) freshness = 4;
    else freshness = 2;
  }

  const matchPercent = Math.max(
    0,
    Math.min(98, Math.round(skillOverlap + titleFamily + seniority - (stale ? 5 : 0))),
  );
  const score = skillOverlap * 2 + titleFamily + seniority + freshness;

  return {
    score,
    matchedSkills,
    matchPercent,
    subScores: { skillOverlap, titleFamily, seniority, freshness },
  };
}

export function rankJobRows(
  rows: JobRow[],
  profile: ProfileMatchInput,
  options?: { limit?: number; minScore?: number }
): JobRow[] {
  const limit = options?.limit ?? rows.length;
  const hasSkills = profile.skills.some((s) => s.trim().length > 0);
  const minScore = options?.minScore ?? (hasSkills ? 8 : 0);

  const scored = rows
    .map((row) => ({ row, ...scoreJobRow(row, profile) }))
    .filter((item) => item.score >= minScore)
    .sort((a, b) => b.score - a.score || (b.row.posted_at ?? "").localeCompare(a.row.posted_at ?? ""));

  return scored.slice(0, limit).map((item) => item.row);
}

/** Score a job card already mapped for the UI (re-score with full profile context). */
export function scoreJobCard(
  job: { title: string; description: string; postedAtIso?: string | null },
  profile: ProfileMatchInput,
  now = Date.now(),
): JobMatchScore {
  return scoreJobRow(
    {
      id: 0,
      external_id: "",
      title: job.title,
      company: "",
      location: "",
      description: job.description,
      apply_url: "",
      posted_at: job.postedAtIso ?? null,
      source: "",
      kind: null,
      classification: null,
      is_community: false,
    },
    profile,
    now,
  );
}

export function buildMatchLabelFromScore(
  row: JobRow,
  score: JobMatchScore,
  skills: string[]
): string {
  if (score.matchedSkills.length > 0) {
    const shown = score.matchedSkills.slice(0, 4);
    return `${score.matchPercent}% match · ${shown.join(", ")}${score.matchedSkills.length > 4 ? "…" : ""}`;
  }
  if (skills.length > 0) {
    return `Lower overlap · ${row.company} · ${row.source}`;
  }
  return `${row.company} · via ${row.source}`;
}
