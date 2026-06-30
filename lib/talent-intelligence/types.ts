/**
 * WorkGraph Talent Intelligence — structured report types.
 * Every recommendation is advisory; never fabricate experience.
 */

export const TALENT_INTELLIGENCE_PROMPT_VERSION = "ti-v1.0.0";

export type MatchDimension =
  | "technical_skills"
  | "domain_experience"
  | "years_of_experience"
  | "education"
  | "certifications"
  | "industry_experience"
  | "leadership"
  | "communication"
  | "responsibilities"
  | "achievements"
  | "business_impact";

export type MatchDimensionScore = {
  dimension: MatchDimension;
  label: string;
  score: number;
  weight: number;
  explanation: string;
};

export type OverallMatchScore = {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  summary: string;
  dimensions: MatchDimensionScore[];
  methodology: string;
};

export type StrengthItem = {
  title: string;
  evidence: string;
  whyItMatters: string;
};

export type MissingSkillItem = {
  skill: string;
  explanation: string;
  howToDemonstrateIfYouHaveIt: string;
};

export type MissingSkills = {
  critical: MissingSkillItem[];
  important: MissingSkillItem[];
  niceToHave: MissingSkillItem[];
};

export type RecruiterExpectation = {
  expectation: string;
  whyRecruitersCare: string;
  howCandidatesDemonstrate: string;
};

export type ResumeSectionName =
  | "summary"
  | "experience"
  | "skills"
  | "projects"
  | "education"
  | "certifications"
  | "achievements";

export type ResumeImprovement = {
  section: ResumeSectionName;
  currentObservation: string;
  whyItMatters: string;
  recommendation: string;
  exampleGuidance: string;
};

export type CoachingQuestion = {
  question: string;
  context: string;
  relatedGap: string;
};

export type ATSIndicator = {
  category: string;
  status: "good" | "warning" | "critical";
  observation: string;
  recommendation: string;
};

export type ATSAnalysis = {
  overallScore: number;
  indicators: ATSIndicator[];
  sectionOrder: string;
  formattingNotes: string;
  readabilityNotes: string;
  lengthAssessment: string;
};

export type KeywordStatus = "present" | "missing" | "weak" | "overused";

export type KeywordItem = {
  keyword: string;
  status: KeywordStatus;
  explanation: string;
  resumeEvidence: string | null;
};

export type KeywordIntelligence = {
  extractedFromJd: string[];
  comparison: KeywordItem[];
  summary: string;
};

export type RecruiterView = {
  standsOut: string[];
  concerns: string[];
  wouldShortlist: boolean;
  shortlistReasoning: string;
  missingEvidence: string[];
  proofRequested: string[];
};

export type InterviewQuestion = {
  question: string;
  whyTheyMightAsk: string;
  relatedGap: string;
  preparationTip: string;
};

export type CareerRecommendation = {
  item: string;
  type: "skill" | "certification" | "project" | "course";
  rationale: string;
};

export type CareerInsights = {
  immediate: CareerRecommendation[];
  threeMonths: CareerRecommendation[];
  sixMonths: CareerRecommendation[];
  longTerm: CareerRecommendation[];
};

export type HonestyIssue = {
  issue: string;
  evidence: string;
  recommendation: string;
  severity: "low" | "medium" | "high";
};

export type HonestyCheck = {
  issues: HonestyIssue[];
  overallAssessment: string;
  authenticityScore: number;
};

export type ParsedJobDescription = {
  title: string | null;
  company: string | null;
  seniority: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  qualifications: string[];
  rawLength: number;
};

/** Full Resume Intelligence Report — flagship deliverable. */
export type ResumeIntelligenceReport = {
  version: string;
  generatedAt: string;
  jobTitle: string | null;
  company: string | null;
  overallMatch: OverallMatchScore;
  strengths: StrengthItem[];
  missingSkills: MissingSkills;
  recruiterExpectations: RecruiterExpectation[];
  resumeImprovements: ResumeImprovement[];
  achievementDiscovery: CoachingQuestion[];
  atsAnalysis: ATSAnalysis;
  keywordIntelligence: KeywordIntelligence;
  recruiterView: RecruiterView;
  interviewReadiness: InterviewQuestion[];
  careerInsights: CareerInsights;
  honestyCheck: HonestyCheck;
  philosophyReminder: string;
};

export type ResumeIntelligenceReportRow = {
  id: string;
  user_id: string;
  resume_version_id: string | null;
  job_id: string | null;
  job_title: string | null;
  company: string | null;
  job_description_text: string;
  job_description_hash: string;
  cache_key: string;
  status: "pending" | "processing" | "completed" | "failed";
  overall_score: number | null;
  report: ResumeIntelligenceReport;
  prompt_version: string;
  llm_model: string | null;
  llm_metadata: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type AnalyzeResumeIntelligenceInput = {
  userId: string;
  resumeText: string;
  resumeUrl?: string | null;
  profileSnapshot?: {
    skills: string[];
    headline?: string | null;
    summary?: string | null;
    yearsOfExperience?: number | null;
    education?: unknown[];
    workExperience?: unknown[];
    certifications?: string[];
  };
  jobDescription: string;
  jobId?: string | null;
  jobTitle?: string | null;
  company?: string | null;
  forceRefresh?: boolean;
};

export type AnalyzeResumeIntelligenceResult = {
  reportId: string;
  cached: boolean;
  report: ResumeIntelligenceReport;
};

export const MATCH_DIMENSION_LABELS: Record<MatchDimension, string> = {
  technical_skills: "Technical Skills",
  domain_experience: "Domain Experience",
  years_of_experience: "Years of Experience",
  education: "Education",
  certifications: "Certifications",
  industry_experience: "Industry Experience",
  leadership: "Leadership",
  communication: "Communication",
  responsibilities: "Responsibilities",
  achievements: "Achievements",
  business_impact: "Business Impact",
};

export const MATCH_DIMENSION_WEIGHTS: Record<MatchDimension, number> = {
  technical_skills: 0.18,
  domain_experience: 0.12,
  years_of_experience: 0.1,
  education: 0.06,
  certifications: 0.05,
  industry_experience: 0.08,
  leadership: 0.08,
  communication: 0.06,
  responsibilities: 0.1,
  achievements: 0.09,
  business_impact: 0.08,
};

export const PHILOSOPHY_REMINDER =
  "WorkGraph helps you present your genuine experience clearly. If you truly have a skill or achievement, describe where and how you used it — never add experience you do not have.";
