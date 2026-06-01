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

const STOPWORDS = new Set([
  "and",
  "the",
  "for",
  "with",
  "your",
  "our",
  "you",
  "will",
  "this",
  "that",
  "from",
  "have",
  "are",
  "job",
  "role",
  "team",
  "work",
  "years",
  "year",
  "experience",
  "preferred",
  "required",
  "responsibilities",
  "qualifications",
]);

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

function extractRoleTerms(headline: string | null | undefined, summary: string | null | undefined): string[] {
  const blob = normalizeWhitespace([headline, summary].filter(Boolean).join(" "));
  if (!blob) return [];
  const terms = new Set<string>();
  for (const word of blob.split(/\W+/u)) {
    if (word.length < 4 || STOPWORDS.has(word)) continue;
    terms.add(word);
  }
  const titleLike = blob.match(
    /\b(senior|staff|principal|lead|junior|engineer|developer|designer|manager|architect|analyst|scientist|consultant|specialist)\b/gi
  );
  for (const t of titleLike ?? []) {
    const w = t.toLowerCase();
    if (!STOPWORDS.has(w)) terms.add(w);
  }
  return [...terms].slice(0, 24);
}

export type JobMatchScore = {
  score: number;
  matchedSkills: string[];
  matchPercent: number;
};

export function scoreJobRow(row: JobRow, profile: ProfileMatchInput): JobMatchScore {
  const skills = profile.skills.map((s) => s.trim()).filter(Boolean);
  const titleHay = normalizeWhitespace(row.title ?? "");
  const descHay = normalizeWhitespace(row.description ?? "");
  const hay = `${titleHay} ${descHay}`.trim();

  const matchedSkills: string[] = [];
  let score = 0;

  for (const skill of skills) {
    const variants = skillVariants(skill);
    let best = 0;
    for (const variant of variants) {
      if (textIncludesTerm(titleHay, variant)) best = Math.max(best, 14);
      else if (textIncludesTerm(hay, variant)) best = Math.max(best, 6);
    }
    if (best > 0) {
      score += best;
      matchedSkills.push(skill);
    }
  }

  for (const term of extractRoleTerms(profile.headline, profile.summary)) {
    if (textIncludesTerm(titleHay, term)) score += 5;
    else if (textIncludesTerm(hay, term)) score += 2;
  }

  const postedAt = row.posted_at ? new Date(row.posted_at).getTime() : NaN;
  if (!Number.isNaN(postedAt)) {
    const days = Math.floor((Date.now() - postedAt) / 86400000);
    if (days <= 7) score += 4;
    else if (days <= 30) score += 2;
  }

  if (skills.length > 0 && matchedSkills.length === 0) {
    score = Math.min(score, 2);
  } else if (matchedSkills.length >= 3) {
    score += 6;
  } else if (matchedSkills.length >= 2) {
    score += 3;
  }

  const maxRealistic = 12 * Math.min(skills.length, 8) + 24;
  const matchPercent =
    skills.length === 0
      ? 72
      : Math.max(
          48,
          Math.min(98, Math.round(52 + (score / Math.max(maxRealistic, 1)) * 44))
        );

  return { score, matchedSkills, matchPercent };
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
  profile: ProfileMatchInput
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
    profile
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
