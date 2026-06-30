import type {
  ATSAnalysis,
  ATSIndicator,
  CareerInsights,
  CareerRecommendation,
  CoachingQuestion,
  HonestyCheck,
  HonestyIssue,
  InterviewQuestion,
  MissingSkillItem,
  MissingSkills,
  OverallMatchScore,
  MatchDimension,
  MatchDimensionScore,
  RecruiterExpectation,
  RecruiterView,
  ResumeImprovement,
  ResumeSectionName,
  StrengthItem,
  KeywordIntelligence,
  KeywordItem,
  KeywordStatus,
} from "../types";
import {
  MATCH_DIMENSION_LABELS,
  MATCH_DIMENSION_WEIGHTS,
  PHILOSOPHY_REMINDER,
  TALENT_INTELLIGENCE_PROMPT_VERSION,
} from "../types";
import { asBoolean, asString, asStringArray, clampScore, scoreToGrade } from "../utils";

function normalizeMissingSkillItems(value: unknown): MissingSkillItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => item && typeof item === "object")
    .map((item) => ({
      skill: asString(item.skill, "Unknown"),
      explanation: asString(item.explanation),
      howToDemonstrateIfYouHaveIt: asString(
        item.howToDemonstrateIfYouHaveIt ?? item.howToDemonstrate,
        "If you have this experience, describe the project, team, and outcome where you used it.",
      ),
    }))
    .filter((item) => item.skill !== "Unknown")
    .slice(0, 8);
}

export function normalizeOverallMatch(raw: unknown): OverallMatchScore {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const score = clampScore(obj.score, 50);
  const dimensionsRaw = Array.isArray(obj.dimensions) ? obj.dimensions : [];

  const dimensions: MatchDimensionScore[] = dimensionsRaw
    .filter((d): d is Record<string, unknown> => d && typeof d === "object")
    .map((d) => {
      const dim = asString(d.dimension, "technical_skills") as MatchDimension;
      const label = MATCH_DIMENSION_LABELS[dim] ?? asString(d.label, dim);
      return {
        dimension: dim,
        label,
        score: clampScore(d.score),
        weight: typeof d.weight === "number" ? d.weight : MATCH_DIMENSION_WEIGHTS[dim] ?? 0.1,
        explanation: asString(d.explanation, "Based on resume evidence vs job requirements."),
      };
    })
    .slice(0, 11);

  if (dimensions.length === 0) {
    for (const [dim, weight] of Object.entries(MATCH_DIMENSION_WEIGHTS)) {
      dimensions.push({
        dimension: dim as MatchDimension,
        label: MATCH_DIMENSION_LABELS[dim as MatchDimension],
        score,
        weight,
        explanation: "Weighted analysis based on available resume content.",
      });
    }
  }

  return {
    score,
    grade: scoreToGrade(score),
    summary: asString(obj.summary, "Your resume shows partial alignment with this role."),
    dimensions,
    methodology: asString(
      obj.methodology,
      "Scores combine evidence from resume sections weighted by recruiter importance for this role — not simple keyword matching.",
    ),
  };
}

export function normalizeStrengths(raw: unknown): StrengthItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => item && typeof item === "object")
    .map((item) => ({
      title: asString(item.title),
      evidence: asString(item.evidence),
      whyItMatters: asString(item.whyItMatters ?? item.why_it_matters),
    }))
    .filter((item) => item.title)
    .slice(0, 8);
}

export function normalizeMissingSkills(raw: unknown): MissingSkills {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    critical: normalizeMissingSkillItems(obj.critical),
    important: normalizeMissingSkillItems(obj.important),
    niceToHave: normalizeMissingSkillItems(obj.niceToHave ?? obj.nice_to_have),
  };
}

export function normalizeRecruiterExpectations(raw: unknown): RecruiterExpectation[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => item && typeof item === "object")
    .map((item) => ({
      expectation: asString(item.expectation),
      whyRecruitersCare: asString(item.whyRecruitersCare ?? item.why_recruiters_care),
      howCandidatesDemonstrate: asString(
        item.howCandidatesDemonstrate ?? item.how_candidates_demonstrate,
      ),
    }))
    .filter((item) => item.expectation)
    .slice(0, 8);
}

const VALID_SECTIONS = new Set<ResumeSectionName>([
  "summary",
  "experience",
  "skills",
  "projects",
  "education",
  "certifications",
  "achievements",
]);

export function normalizeResumeImprovements(raw: unknown): ResumeImprovement[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => item && typeof item === "object")
    .map((item) => {
      const section = asString(item.section, "experience") as ResumeSectionName;
      return {
        section: VALID_SECTIONS.has(section) ? section : "experience",
        currentObservation: asString(item.currentObservation ?? item.current_observation),
        whyItMatters: asString(item.whyItMatters ?? item.why_it_matters),
        recommendation: asString(item.recommendation),
        exampleGuidance: asString(item.exampleGuidance ?? item.example_guidance),
      };
    })
    .filter((item) => item.recommendation)
    .slice(0, 12);
}

export function normalizeCoachingQuestions(raw: unknown): CoachingQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => item && typeof item === "object")
    .map((item) => ({
      question: asString(item.question),
      context: asString(item.context),
      relatedGap: asString(item.relatedGap ?? item.related_gap),
    }))
    .filter((item) => item.question)
    .slice(0, 10);
}

export function normalizeAtsAnalysis(raw: unknown): ATSAnalysis {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const indicatorsRaw = Array.isArray(obj.indicators) ? obj.indicators : [];

  const indicators: ATSIndicator[] = indicatorsRaw
    .filter((i): i is Record<string, unknown> => i && typeof i === "object")
    .map((i) => ({
      category: asString(i.category, "General"),
      status: (["good", "warning", "critical"].includes(asString(i.status))
        ? asString(i.status)
        : "warning") as ATSIndicator["status"],
      observation: asString(i.observation),
      recommendation: asString(i.recommendation),
    }))
    .slice(0, 15);

  return {
    overallScore: clampScore(obj.overallScore ?? obj.overall_score, 60),
    indicators,
    sectionOrder: asString(obj.sectionOrder ?? obj.section_order, "Review section ordering for ATS parsers."),
    formattingNotes: asString(obj.formattingNotes ?? obj.formatting_notes),
    readabilityNotes: asString(obj.readabilityNotes ?? obj.readability_notes),
    lengthAssessment: asString(obj.lengthAssessment ?? obj.length_assessment),
  };
}

function normalizeKeywordStatus(value: unknown): KeywordStatus {
  const s = asString(value, "missing");
  if (s === "present" || s === "missing" || s === "weak" || s === "overused") return s;
  return "missing";
}

export function normalizeKeywordIntelligence(
  raw: unknown,
  fallback?: KeywordIntelligence,
): KeywordIntelligence {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const comparisonRaw = Array.isArray(obj.comparison) ? obj.comparison : [];

  const comparison: KeywordItem[] = comparisonRaw
    .filter((k): k is Record<string, unknown> => k && typeof k === "object")
    .map((k) => ({
      keyword: asString(k.keyword),
      status: normalizeKeywordStatus(k.status),
      explanation: asString(k.explanation),
      resumeEvidence: k.resumeEvidence ?? k.resume_evidence ? asString(k.resumeEvidence ?? k.resume_evidence) : null,
    }))
    .filter((k) => k.keyword)
    .slice(0, 25);

  if (comparison.length === 0 && fallback) return fallback;

  return {
    extractedFromJd: asStringArray(obj.extractedFromJd ?? obj.extracted_from_jd, 40),
    comparison: comparison.length ? comparison : (fallback?.comparison ?? []),
    summary: asString(obj.summary, fallback?.summary ?? "Keyword alignment analysis complete."),
  };
}

export function normalizeRecruiterView(raw: unknown): RecruiterView {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    standsOut: asStringArray(obj.standsOut ?? obj.stands_out, 8),
    concerns: asStringArray(obj.concerns, 8),
    wouldShortlist: asBoolean(obj.wouldShortlist ?? obj.would_shortlist),
    shortlistReasoning: asString(obj.shortlistReasoning ?? obj.shortlist_reasoning),
    missingEvidence: asStringArray(obj.missingEvidence ?? obj.missing_evidence, 8),
    proofRequested: asStringArray(obj.proofRequested ?? obj.proof_requested, 8),
  };
}

export function normalizeInterviewQuestions(raw: unknown): InterviewQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => item && typeof item === "object")
    .map((item) => ({
      question: asString(item.question),
      whyTheyMightAsk: asString(item.whyTheyMightAsk ?? item.why_they_might_ask),
      relatedGap: asString(item.relatedGap ?? item.related_gap),
      preparationTip: asString(item.preparationTip ?? item.preparation_tip),
    }))
    .filter((item) => item.question)
    .slice(0, 10);
}

function normalizeCareerRecs(raw: unknown): CareerRecommendation[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => item && typeof item === "object")
    .map((item) => ({
      item: asString(item.item),
      type: (["skill", "certification", "project", "course"].includes(asString(item.type))
        ? asString(item.type)
        : "skill") as CareerRecommendation["type"],
      rationale: asString(item.rationale),
    }))
    .filter((item) => item.item)
    .slice(0, 6);
}

export function normalizeCareerInsights(raw: unknown): CareerInsights {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    immediate: normalizeCareerRecs(obj.immediate),
    threeMonths: normalizeCareerRecs(obj.threeMonths ?? obj.three_months),
    sixMonths: normalizeCareerRecs(obj.sixMonths ?? obj.six_months),
    longTerm: normalizeCareerRecs(obj.longTerm ?? obj.long_term),
  };
}

export function normalizeHonestyCheck(raw: unknown): HonestyCheck {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const issuesRaw = Array.isArray(obj.issues) ? obj.issues : [];

  const issues: HonestyIssue[] = issuesRaw
    .filter((i): i is Record<string, unknown> => i && typeof i === "object")
    .map((i) => ({
      issue: asString(i.issue),
      evidence: asString(i.evidence),
      recommendation: asString(i.recommendation),
      severity: (["low", "medium", "high"].includes(asString(i.severity))
        ? asString(i.severity)
        : "low") as HonestyIssue["severity"],
    }))
    .filter((i) => i.issue)
    .slice(0, 8);

  return {
    issues,
    overallAssessment: asString(
      obj.overallAssessment ?? obj.overall_assessment,
      "Resume reads as generally authentic. Focus on adding measurable outcomes where you have them.",
    ),
    authenticityScore: clampScore(obj.authenticityScore ?? obj.authenticity_score, 75),
  };
}

export { PHILOSOPHY_REMINDER, TALENT_INTELLIGENCE_PROMPT_VERSION };
