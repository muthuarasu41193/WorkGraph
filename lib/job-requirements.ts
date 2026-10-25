/**
 * Skills a posting names that a profile does not show.
 * Word match only. Not used by match percent or rank.
 */

import { SKILL_ALIASES, skillVariants } from "./job-match";

/** Common non-technical skills. Matched as whole phrases, not inferred. */
export const COMMON_NON_TECH_SKILLS = [
  "stakeholder management",
  "financial modeling",
  "financial analysis",
  "project management",
  "change management",
  "account management",
  "customer success",
  "business development",
  "public speaking",
  "negotiation",
  "budgeting",
  "forecasting",
  "excel",
  "powerpoint",
  "sales",
  "marketing",
  "recruiting",
  "talent acquisition",
  "user research",
  "copywriting",
] as const;

export const MISSING_SKILLS_LIMIT = 5;
export const MISSING_SKILLS_DETAIL_LIMIT = 10;

/** Placeholder until resume tailoring is wired. Free users at the cap use /pricing. */
export const TAILOR_PLACEHOLDER_HREF = "#tailor-for-this-job";

const MAX_SCAN_CHARS = 50_000;
const SKILL_TEXT_MAX = 80;
const PROFILE_SKILL_MAX = 100;

/**
 * Bucket keys whose bare words are not skills. "machine learning" still matches
 * the machine bucket. "data scientist" still matches the data bucket.
 */
const BARE_KEY_SKIP = new Set(["machine", "data"]);

type Term = { canonical: string; term: string; re: RegExp };

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function clipText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.length > MAX_SCAN_CHARS ? value.slice(0, MAX_SCAN_CHARS) : value;
}

function buildTerms(): Term[] {
  const terms: Term[] = [];
  const seen = new Set<string>();

  function add(canonical: string, raw: string) {
    const term = raw.trim().toLowerCase();
    if (term.length < 2) return;
    const key = `${canonical.toLowerCase()}\0${term}`;
    if (seen.has(key)) return;
    seen.add(key);
    terms.push({
      canonical,
      term,
      re: new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(term)}(?:$|[^a-z0-9])`, "i"),
    });
  }

  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    if (!BARE_KEY_SKIP.has(canonical)) add(canonical, canonical);
    for (const alias of aliases) add(canonical, alias);
  }
  for (const name of COMMON_NON_TECH_SKILLS) add(name, name);
  return terms;
}

const TERMS = buildTerms();

function locate(text: string, term: Term): number {
  const match = term.re.exec(text);
  if (!match) return -1;
  return match[0].toLowerCase().startsWith(term.term) ? match.index : match.index + 1;
}

/**
 * Canonical skill names in title + description.
 * Description order is kept. A skill that appears only in the title sorts first.
 */
export function extractJobSkills(title: unknown, description: unknown): string[] {
  const titleText = clipText(title);
  const descriptionText = clipText(description);
  if (!titleText && !descriptionText) return [];

  const best = new Map<string, { canonical: string; index: number }>();
  for (const term of TERMS) {
    const inTitle = titleText ? locate(titleText, term) : -1;
    const inDescription = descriptionText ? locate(descriptionText, term) : -1;
    let index = -1;
    if (inDescription >= 0) index = titleText.length + 1 + inDescription;
    else if (inTitle >= 0) index = inTitle;
    if (index < 0) continue;
    const key = term.canonical.toLowerCase();
    const prev = best.get(key);
    if (!prev || index < prev.index) best.set(key, { canonical: term.canonical, index });
  }

  return [...best.values()]
    .sort((a, b) => a.index - b.index || a.canonical.localeCompare(b.canonical))
    .map((item) => item.canonical);
}

function cleanSkills(skills: unknown, max: number): string[] {
  if (!Array.isArray(skills)) return [];
  const out: string[] = [];
  for (const item of skills) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    out.push(trimmed.slice(0, SKILL_TEXT_MAX));
    if (out.length >= max) break;
  }
  return out;
}

function variantSet(skill: string): Set<string> {
  const variants = new Set<string>();
  for (const variant of skillVariants(skill)) {
    const trimmed = variant.trim().toLowerCase();
    if (trimmed.length >= 2) variants.add(trimmed);
  }
  return variants;
}

function containsWord(haystack: string, word: string): boolean {
  if (word.length < 2 || haystack.length < word.length) return false;
  const re = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(word)}(?:$|[^a-z0-9])`, "i");
  return re.test(haystack);
}

function profileCovers(jobSkill: string, profileSkills: string[], profileVariants: Set<string>): boolean {
  for (const variant of variantSet(jobSkill)) {
    if (profileVariants.has(variant)) return true;
  }
  const job = jobSkill.trim().toLowerCase();
  for (const profileSkill of profileSkills) {
    if (containsWord(profileSkill.toLowerCase(), job)) return true;
  }
  return false;
}

/**
 * Job skills the profile does not show. Same variants as scoring, so
 * "Node.js" and "nodejs" are one skill. Empty profile returns no list.
 * Order is the order of jobSkills (first appearance in the posting).
 */
export function missingSkills(jobSkills: unknown, profileSkills: unknown, limit = MISSING_SKILLS_LIMIT): string[] {
  const cap = Number.isFinite(limit) ? Math.max(0, Math.min(50, Math.floor(limit))) : MISSING_SKILLS_LIMIT;
  if (cap === 0) return [];
  const profile = cleanSkills(profileSkills, PROFILE_SKILL_MAX);
  if (profile.length === 0) return [];

  const profileVariants = new Set<string>();
  for (const skill of profile) {
    for (const variant of variantSet(skill)) profileVariants.add(variant);
  }

  const seen = new Set<string>();
  const missing: string[] = [];
  for (const skill of cleanSkills(jobSkills, 100)) {
    const key = skill.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (profileCovers(skill, profile, profileVariants)) continue;
    missing.push(skill);
    if (missing.length >= cap) break;
  }
  return missing;
}

type SkillJob = { title?: string; description?: string; missingSkills?: string[] };

/** Fill missingSkills once. Skips jobs that already have a list. */
export function attachMissingSkills<T extends SkillJob>(
  job: T,
  profileSkills: string[],
  limit = MISSING_SKILLS_LIMIT,
): T {
  if (Array.isArray(job.missingSkills)) return job;
  if (!profileSkills.some((skill) => skill.trim())) return { ...job, missingSkills: [] };
  return {
    ...job,
    missingSkills: missingSkills(extractJobSkills(job.title ?? "", job.description ?? ""), profileSkills, limit),
  };
}

export function attachMissingSkillsToJobs<T extends SkillJob>(
  jobs: T[],
  profileSkills: string[],
  limit = MISSING_SKILLS_LIMIT,
): T[] {
  return jobs.map((job) => attachMissingSkills(job, profileSkills, limit));
}

export type TailorEntitlement = "ok" | "limit_reached" | "unavailable" | "anonymous";

/** Same bar as the profile jobs tab: stored resume text, or a stored resume URL. */
export function profileHasResume(
  profile: { resume_raw_text?: string | null; resume_url?: string | null } | null | undefined,
): boolean {
  if (!profile) return false;
  const text = typeof profile.resume_raw_text === "string" ? profile.resume_raw_text.trim() : "";
  if (text.length >= 120) return true;
  const url = typeof profile.resume_url === "string" ? profile.resume_url.trim() : "";
  return url.length > 0;
}

/** No resume or no usable session hides the link. A free user at the cap goes to pricing. */
export function tailorLinkHref(input: { hasResume: boolean; entitlement: TailorEntitlement }): string | null {
  if (!input.hasResume) return null;
  if (input.entitlement === "limit_reached") return "/pricing";
  if (input.entitlement === "ok") return TAILOR_PLACEHOLDER_HREF;
  return null;
}
