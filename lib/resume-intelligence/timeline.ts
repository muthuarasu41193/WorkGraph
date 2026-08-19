import type { NormalizedEducation } from "./education";
import type { NormalizedExperience } from "./experience";
import type { NormalizedResume } from "./schema";

const TITLE_SENIORITY: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b(intern|internship)\b/i, label: "Intern" },
  { pattern: /\b(junior|entry[- ]?level|graduate)\b/i, label: "Junior" },
  { pattern: /\b(senior|sr\.?)\b/i, label: "Senior" },
  { pattern: /\b(staff|principal)\b/i, label: "Staff/Principal" },
  { pattern: /\b(director|head of|vp|vice president|chief)\b/i, label: "Director+" },
  { pattern: /\b(lead|manager)\b/i, label: "Lead" },
  { pattern: /\b(mid[- ]?level|intermediate)\b/i, label: "Mid-level" },
];

export function buildCareerTimeline(
  experience: NormalizedExperience[],
  education: NormalizedEducation[],
): NormalizedResume["career_timeline"] {
  const entries: NormalizedResume["career_timeline"] = [];

  for (const item of experience) {
    entries.push({
      kind: "experience",
      title: item.title,
      organization: item.company,
      start_date: item.start_date,
      end_date: item.end_date,
      is_current: item.is_current,
      confidence: item.confidence,
    });
  }
  for (const item of education) {
    entries.push({
      kind: "education",
      title: item.degree,
      organization: item.institution,
      start_date: item.start_year ? `${item.start_year}-01` : null,
      end_date: item.end_year ? `${item.end_year}-01` : null,
      is_current: false,
      confidence: item.confidence,
    });
  }

  entries.sort((a, b) => {
    const av = a.start_date ?? a.end_date ?? "";
    const bv = b.start_date ?? b.end_date ?? "";
    return bv.localeCompare(av);
  });
  return entries;
}

/**
 * Seniority from job titles and computed years only — never from age or demographics.
 */
export function inferSeniority(
  experience: NormalizedExperience[],
  years: number | null,
): NormalizedResume["seniority"] {
  for (const item of experience) {
    for (const { pattern, label } of TITLE_SENIORITY) {
      if (pattern.test(item.title)) {
        return { value: label, confidence: Math.min(0.9, item.confidence) };
      }
    }
  }
  if (years == null) return null;
  if (years >= 12) return { value: "Director+", confidence: 0.55 };
  if (years >= 8) return { value: "Lead", confidence: 0.55 };
  if (years >= 5) return { value: "Senior", confidence: 0.55 };
  if (years >= 2) return { value: "Mid-level", confidence: 0.55 };
  if (years >= 0) return { value: "Junior", confidence: 0.5 };
  return null;
}
