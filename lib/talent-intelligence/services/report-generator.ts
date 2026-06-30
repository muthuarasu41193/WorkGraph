import type { ResumeIntelligenceReport } from "../types";
import { PHILOSOPHY_REMINDER, TALENT_INTELLIGENCE_PROMPT_VERSION } from "../types";
import { truncateText } from "../utils";
import {
  TALENT_INTELLIGENCE_SYSTEM_PROMPT,
  MATCH_AND_GAPS_PROMPT_ID,
  RESUME_RECRUITER_PROMPT_ID,
  COACHING_PROMPT_ID,
  ATS_KEYWORDS_PROMPT_ID,
  buildMatchAndGapsUserPrompt,
  buildResumeRecruiterUserPrompt,
  buildCoachingUserPrompt,
  buildAtsKeywordsUserPrompt,
} from "../prompts";
import { runTalentIntelligencePrompt, PROMPT_CHAIN_DELAY_MS, type LlmRunMeta } from "./llm-runner";
import { parseJobDescription } from "./job-description-parser";
import { analyzeKeywords } from "./keyword-analyzer";
import {
  normalizeOverallMatch,
  normalizeStrengths,
  normalizeMissingSkills,
  normalizeRecruiterExpectations,
  normalizeResumeImprovements,
  normalizeCoachingQuestions,
  normalizeAtsAnalysis,
  normalizeKeywordIntelligence,
  normalizeRecruiterView,
  normalizeInterviewQuestions,
  normalizeCareerInsights,
  normalizeHonestyCheck,
} from "../normalize";

export type ReportGeneratorInput = {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string | null;
  company?: string | null;
  profileSkills?: string[];
};

export type ReportGeneratorResult = {
  report: ResumeIntelligenceReport;
  llmMetadata: Record<string, LlmRunMeta>;
};

/**
 * ReportGenerator — chains four dedicated LLM analyses sequentially
 * (with pacing) to avoid Groq TPM bursts, merges deterministic keyword pre-analysis.
 */
export async function generateResumeIntelligenceReport(
  input: ReportGeneratorInput,
): Promise<ReportGeneratorResult> {
  const resumeText = truncateText(input.resumeText, 12_000);
  const jobDescription = truncateText(input.jobDescription, 8_000);
  const parsedJd = parseJobDescription(jobDescription, {
    title: input.jobTitle ?? undefined,
    company: input.company ?? undefined,
  });

  const deterministicKeywords = analyzeKeywords(resumeText, jobDescription);

  const matchGaps = await runTalentIntelligencePrompt<Record<string, unknown>>({
    promptId: MATCH_AND_GAPS_PROMPT_ID,
    system: TALENT_INTELLIGENCE_SYSTEM_PROMPT,
    user: buildMatchAndGapsUserPrompt({
      resumeText,
      jobDescription,
      jobTitle: input.jobTitle ?? parsedJd.title,
      company: input.company ?? parsedJd.company,
      profileSkills: input.profileSkills,
    }),
  });

  await sleep(PROMPT_CHAIN_DELAY_MS);

  const resumeRecruiter = await runTalentIntelligencePrompt<Record<string, unknown>>({
    promptId: RESUME_RECRUITER_PROMPT_ID,
    system: TALENT_INTELLIGENCE_SYSTEM_PROMPT,
    user: buildResumeRecruiterUserPrompt({
      resumeText,
      jobDescription,
      jobTitle: input.jobTitle ?? parsedJd.title,
    }),
  });

  await sleep(PROMPT_CHAIN_DELAY_MS);

  const coaching = await runTalentIntelligencePrompt<Record<string, unknown>>({
    promptId: COACHING_PROMPT_ID,
    system: TALENT_INTELLIGENCE_SYSTEM_PROMPT,
    user: buildCoachingUserPrompt({
      resumeText,
      jobDescription,
      jobTitle: input.jobTitle ?? parsedJd.title,
    }),
  });

  await sleep(PROMPT_CHAIN_DELAY_MS);

  const atsKeywords = await runTalentIntelligencePrompt<Record<string, unknown>>({
    promptId: ATS_KEYWORDS_PROMPT_ID,
    system: TALENT_INTELLIGENCE_SYSTEM_PROMPT,
    user: buildAtsKeywordsUserPrompt({
      resumeText,
      jobDescription,
      deterministicKeywords: deterministicKeywords.extractedFromJd,
    }),
  });

  const overallMatch = normalizeOverallMatch(matchGaps.data.overallMatch ?? matchGaps.data);

  const report: ResumeIntelligenceReport = {
    version: TALENT_INTELLIGENCE_PROMPT_VERSION,
    generatedAt: new Date().toISOString(),
    jobTitle: input.jobTitle ?? parsedJd.title,
    company: input.company ?? parsedJd.company,
    overallMatch,
    strengths: normalizeStrengths(matchGaps.data.strengths),
    missingSkills: normalizeMissingSkills(matchGaps.data.missingSkills ?? matchGaps.data.missing_skills),
    recruiterExpectations: normalizeRecruiterExpectations(resumeRecruiter.data.recruiterExpectations),
    resumeImprovements: normalizeResumeImprovements(resumeRecruiter.data.resumeImprovements),
    achievementDiscovery: normalizeCoachingQuestions(coaching.data.achievementDiscovery),
    atsAnalysis: normalizeAtsAnalysis(atsKeywords.data.atsAnalysis),
    keywordIntelligence: normalizeKeywordIntelligence(
      atsKeywords.data.keywordIntelligence,
      deterministicKeywords,
    ),
    recruiterView: normalizeRecruiterView(resumeRecruiter.data.recruiterView),
    interviewReadiness: normalizeInterviewQuestions(coaching.data.interviewReadiness),
    careerInsights: normalizeCareerInsights(coaching.data.careerInsights),
    honestyCheck: normalizeHonestyCheck(resumeRecruiter.data.honestyCheck),
    philosophyReminder: PHILOSOPHY_REMINDER,
  };

  return {
    report,
    llmMetadata: {
      matchGaps: matchGaps.meta,
      resumeRecruiter: resumeRecruiter.meta,
      coaching: coaching.meta,
      atsKeywords: atsKeywords.meta,
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
