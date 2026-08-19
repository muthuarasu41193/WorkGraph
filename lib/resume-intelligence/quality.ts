import { runDeterministicAtsChecks } from "@/lib/talent-intelligence/services/ats-analyzer";

import type { NormalizedResume, QualityAnalysis } from "./schema";

const DISCLAIMER =
  "These scores are estimates and recommendations, not hiring probabilities or certified assessments.";

export function analyzeResumeQuality(
  sourceText: string,
  resume: Pick<
    NormalizedResume,
    "identity" | "skills" | "experience" | "education" | "professional_summary" | "certifications"
  >,
): QualityAnalysis {
  const indicators = runDeterministicAtsChecks(sourceText).map((item) => ({
    category: item.category,
    status: item.status,
    observation: item.observation,
    recommendation: item.recommendation,
  }));

  let completeness = 0;
  if (resume.identity.full_name) completeness += 15;
  if (resume.identity.email) completeness += 10;
  if (resume.professional_summary) completeness += 10;
  if (resume.skills.length >= 3) completeness += 15;
  if (resume.experience.length >= 1) completeness += 20;
  if (resume.education.length >= 1) completeness += 15;
  if (resume.identity.location) completeness += 5;
  if (resume.certifications.length > 0) completeness += 5;
  completeness = Math.min(100, completeness);

  const good = indicators.filter((i) => i.status === "good").length;
  const warning = indicators.filter((i) => i.status === "warning").length;
  const critical = indicators.filter((i) => i.status === "critical").length;
  const overall_score = Math.max(
    0,
    Math.min(100, Math.round(completeness * 0.55 + (good * 12 - warning * 6 - critical * 12))),
  );

  indicators.push({
    category: "Estimate",
    status: "good",
    observation: DISCLAIMER,
    recommendation: "Use this as guidance while you edit your own resume.",
  });

  return {
    overall_score,
    completeness,
    indicators,
    estimate_disclaimer: DISCLAIMER,
  };
}
