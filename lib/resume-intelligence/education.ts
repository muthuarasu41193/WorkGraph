import { LIMITS } from "@/lib/validation/primitives";

import { evidenceConfidence, roundConfidence } from "./text";

export type NormalizedEducation = {
  degree: string;
  institution: string;
  year: string;
  start_year: string | null;
  end_year: string | null;
  confidence: number;
};

function yearFromText(value: string): string | null {
  const match = value.match(/(?:19|20)\d{2}/);
  return match ? match[0] : null;
}

export function normalizeEducation(raw: unknown, sourceLower: string): NormalizedEducation[] {
  if (!Array.isArray(raw)) return [];
  const out: NormalizedEducation[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const degree = typeof rec.degree === "string" ? rec.degree.trim().slice(0, LIMITS.jobTitle) : "";
    const institution =
      typeof rec.institution === "string" ? rec.institution.trim().slice(0, LIMITS.company) : "";
    const year = typeof rec.year === "string" ? rec.year.trim().slice(0, LIMITS.duration) : "";
    if (!degree && !institution) continue;

    const degreeConf = degree ? evidenceConfidence(sourceLower, degree) : 0.6;
    const instConf = institution ? evidenceConfidence(sourceLower, institution) : 0.6;
    if (degree && degreeConf == null) continue;
    if (institution && instConf == null) continue;

    const yearGrounded = !year || evidenceConfidence(sourceLower, year) != null;
    const years = (yearGrounded ? year : "").match(/(?:19|20)\d{2}/g) ?? [];

    out.push({
      degree,
      institution,
      year: yearGrounded ? year : "",
      start_year: years[0] ?? yearFromText(degree) ?? null,
      end_year: years[1] ?? years[0] ?? null,
      confidence: roundConfidence(Math.min(degreeConf ?? 0.6, instConf ?? 0.6)),
    });
    if (out.length >= LIMITS.educationItems) break;
  }
  return out;
}
