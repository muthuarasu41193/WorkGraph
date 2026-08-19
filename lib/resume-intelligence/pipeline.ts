import { LIMITS } from "@/lib/validation/primitives";
import type { AiParsedResume } from "@/lib/validation/resume";

import { normalizeEducation } from "./education";
import { embedNormalizedResume } from "./embeddings";
import { computeYearsFromExperience, normalizeExperience } from "./experience";
import { extractFromResumeText, groundedString, groundedStringList } from "./heuristic";
import { stripProtectedFields } from "./protected";
import { analyzeResumeQuality } from "./quality";
import {
  RESUME_INTELLIGENCE_SCHEMA_VERSION,
  parseNormalizedResume,
  type EmploymentPreferences,
  type NormalizedResume,
} from "./schema";
import { normalizeSkills, partitionSkills } from "./skills";
import { confident, evidenceConfidence, lowerCollapsed, roundConfidence } from "./text";
import { buildCareerTimeline, inferSeniority } from "./timeline";

export type UntrustedResumeExtract = Partial<AiParsedResume> & {
  technical_skills?: unknown;
  soft_skills?: unknown;
  projects?: unknown;
  achievements?: unknown;
  industries?: unknown;
  locations?: unknown;
  target_roles?: unknown;
  employment_preferences?: unknown;
  skill_confidences?: unknown;
  headline?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mergeStringLists(...lists: unknown[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (typeof item !== "string") continue;
      const trimmed = item.trim();
      const key = trimmed.toLowerCase();
      if (!trimmed || seen.has(key)) continue;
      seen.add(key);
      out.push(trimmed);
    }
  }
  return out;
}

function mergeExperience(ai: unknown, heuristic: unknown): unknown[] {
  const a = Array.isArray(ai) ? ai : [];
  const b = Array.isArray(heuristic) ? heuristic : [];
  return [...a, ...b];
}

function statedYears(sourceLower: string, extracted: unknown): number | null {
  const n = typeof extracted === "number" ? extracted : Number(extracted);
  if (!Number.isFinite(n) || n < 0 || n > LIMITS.years) return null;
  const rounded = Math.round(n);
  if (evidenceConfidence(sourceLower, String(rounded), [`${rounded} years`, `${rounded}+ years`]) == null) {
    return null;
  }
  return rounded;
}

function preferencesFromText(
  sourceLower: string,
  notes: string[],
  extracted: unknown,
): EmploymentPreferences {
  const rec = asRecord(stripProtectedFields(extracted));
  let location_mode: EmploymentPreferences["location_mode"] = null;
  if (notes.includes("remote") || (typeof rec.location_mode === "string" && rec.location_mode === "remote" && sourceLower.includes("remote"))) {
    location_mode = "remote";
  } else if (notes.includes("hybrid") || (rec.location_mode === "hybrid" && sourceLower.includes("hybrid"))) {
    location_mode = "hybrid";
  } else if (typeof rec.location_mode === "string" && rec.location_mode === "onsite" && sourceLower.includes("onsite")) {
    location_mode = "onsite";
  }

  const job_types: string[] = [];
  const allowedTypes = ["Full-time", "Part-time", "Contract", "Freelance", "Internship", "Temporary"];
  const rawTypes = Array.isArray(rec.job_types) ? rec.job_types : [];
  for (const type of rawTypes) {
    if (typeof type !== "string") continue;
    const match = allowedTypes.find((item) => item.toLowerCase() === type.trim().toLowerCase());
    if (match && sourceLower.includes(match.toLowerCase())) job_types.push(match);
  }

  const willing =
    notes.includes("relocate")
      ? true
      : rec.willing_to_relocate === true && sourceLower.includes("reloc")
        ? true
        : null;

  const extractedNotes = Array.isArray(rec.notes)
    ? rec.notes.filter((n): n is string => typeof n === "string")
    : [];
  const groundedNotes = groundedStringList(sourceLower, [...notes, ...extractedNotes], 8).map((n) => n.value);

  return {
    location_mode,
    job_types: [...new Set(job_types)].slice(0, 8),
    willing_to_relocate: willing,
    notes: groundedNotes,
  };
}

function applySkillConfidences(
  skills: ReturnType<typeof normalizeSkills>,
  raw: unknown,
): ReturnType<typeof normalizeSkills> {
  if (!Array.isArray(raw)) return skills;
  const byName = new Map<string, number>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    if (typeof rec.skill !== "string") continue;
    const n = typeof rec.confidence === "number" ? rec.confidence : Number(rec.confidence);
    if (!Number.isFinite(n)) continue;
    byName.set(rec.skill.trim().toLowerCase(), roundConfidence(n));
  }
  return skills.map((skill) => {
    const hinted = byName.get(skill.skill.toLowerCase()) ?? byName.get(skill.canonical ?? "");
    if (hinted == null) return skill;
    return { ...skill, confidence: roundConfidence(Math.min(skill.confidence, hinted)) };
  });
}

/**
 * Deterministic Resume Intelligence pipeline. AI extract is optional and untrusted.
 * Does not invent facts; drops claims that are not present in the resume text.
 */
export function buildNormalizedResume(opts: {
  sourceText: string;
  extracted?: unknown;
}): NormalizedResume {
  const sourceText = opts.sourceText;
  const sourceLower = lowerCollapsed(sourceText);
  const cleanedExtract = stripProtectedFields(opts.extracted);
  const ai = asRecord(cleanedExtract);
  const heuristic = extractFromResumeText(sourceText);

  const identity = {
    full_name: groundedString(sourceLower, ai.full_name) ?? confident(heuristic.full_name, 0.85),
    email: groundedString(sourceLower, ai.email) ?? (heuristic.email ? confident(heuristic.email, 0.97) : null),
    phone: groundedString(sourceLower, ai.phone) ?? (heuristic.phone ? confident(heuristic.phone, 0.9) : null),
    location:
      groundedString(sourceLower, ai.location) ?? (heuristic.location ? confident(heuristic.location, 0.9) : null),
    headline:
      groundedString(sourceLower, ai.headline) ?? (heuristic.headline ? confident(heuristic.headline, 0.85) : null),
    linkedin_url: groundedString(sourceLower, ai.linkedin_url) ?? (heuristic.linkedin_url ? confident(heuristic.linkedin_url, 0.97) : null),
    github_url: groundedString(sourceLower, ai.github_url) ?? (heuristic.github_url ? confident(heuristic.github_url, 0.97) : null),
    website_url: groundedString(sourceLower, ai.website_url) ?? (heuristic.website_url ? confident(heuristic.website_url, 0.9) : null),
  };

  const mergedSkills = mergeStringLists(ai.skills, ai.technical_skills, ai.soft_skills, heuristic.skills);
  let skills = normalizeSkills(mergedSkills, sourceLower);
  skills = applySkillConfidences(skills, ai.skill_confidences);
  const partitioned = partitionSkills(skills);

  const experience = normalizeExperience(
    mergeExperience(ai.work_experience, heuristic.work_experience),
    sourceLower,
  );
  const education = normalizeEducation(
    [...(Array.isArray(ai.education) ? ai.education : []), ...heuristic.education],
    sourceLower,
  );

  const certifications = groundedStringList(
    sourceLower,
    mergeStringLists(ai.certifications, heuristic.certifications),
    LIMITS.certifications,
  ).map((item) => ({ name: item.value, confidence: item.confidence }));

  const projectSource = [
    ...(Array.isArray(ai.projects) ? ai.projects : []),
    ...heuristic.projects,
  ];
  const projects = [];
  const seenProjects = new Set<string>();
  for (const item of projectSource) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const name = groundedString(sourceLower, rec.name);
    if (!name || seenProjects.has(name.value.toLowerCase())) continue;
    seenProjects.add(name.value.toLowerCase());
    const description = groundedString(sourceLower, rec.description);
    projects.push({
      name: name.value.slice(0, LIMITS.jobTitle),
      description: description?.value.slice(0, LIMITS.description) ?? "",
      confidence: name.confidence,
    });
    if (projects.length >= 30) break;
  }

  const achievements = groundedStringList(
    sourceLower,
    mergeStringLists(ai.achievements, heuristic.achievements),
    30,
  );
  const industries = groundedStringList(
    sourceLower,
    mergeStringLists(ai.industries, heuristic.industries),
    20,
  );
  const locations = groundedStringList(
    sourceLower,
    mergeStringLists(ai.locations, heuristic.location ? [heuristic.location] : [], identity.location ? [identity.location.value] : []),
    20,
  );
  const target_roles = groundedStringList(
    sourceLower,
    mergeStringLists(ai.target_roles, heuristic.target_roles, identity.headline ? [identity.headline.value] : []),
    12,
  );

  const timelineYears = computeYearsFromExperience(experience);
  const stated = statedYears(sourceLower, ai.years_of_experience);
  const years_of_experience =
    timelineYears > 0
      ? { value: timelineYears, confidence: 0.8, basis: "timeline" as const }
      : stated != null
        ? { value: stated, confidence: 0.75, basis: "stated" as const }
        : null;

  const professional_summary =
    groundedString(sourceLower, ai.summary) ??
    (heuristic.summary ? confident(heuristic.summary, 0.85) : null);

  const career_timeline = buildCareerTimeline(experience, education);
  const seniority = inferSeniority(experience, years_of_experience?.value ?? null);
  const employment_preferences = preferencesFromText(sourceLower, heuristic.employment_notes, ai.employment_preferences);

  const draft = {
    schema_version: RESUME_INTELLIGENCE_SCHEMA_VERSION,
    identity,
    professional_summary,
    target_roles,
    skills: partitioned.skills,
    technical_skills: partitioned.technical_skills,
    soft_skills: partitioned.soft_skills,
    experience,
    education,
    certifications,
    projects,
    achievements,
    industries,
    locations,
    years_of_experience,
    career_timeline,
    seniority,
    employment_preferences,
    quality: analyzeResumeQuality(sourceText, {
      identity,
      skills: partitioned.skills,
      experience,
      education,
      professional_summary,
      certifications,
    }),
  };

  const embedding = embedNormalizedResume(draft);
  return parseNormalizedResume({ ...draft, embedding });
}

export function publicResumeIntelligence(resume: NormalizedResume) {
  const stored = { ...resume };
  delete stored.embedding;
  return stored;
}
