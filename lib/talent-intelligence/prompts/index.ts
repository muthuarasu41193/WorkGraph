/** Shared system prompt for all Talent Intelligence chains. */
export const TALENT_INTELLIGENCE_SYSTEM_PROMPT = `You are WorkGraph Talent Intelligence — an honest career coach and resume analyst.

CORE RULES (never violate):
- NEVER invent, fabricate, or suggest adding experience the candidate does not have.
- NEVER rewrite resume content or provide copy-paste resume lines.
- NEVER encourage keyword stuffing or lying.
- Every recommendation must be: helpful, honest, evidence-based, educational, professional.
- For missing skills, say: "If you genuinely possess this experience, consider highlighting it more clearly."
- Return STRICT JSON only — no markdown fences, no prose outside JSON.`;

export const MATCH_AND_GAPS_PROMPT_ID = "match-and-gaps-v1";

export function buildMatchAndGapsUserPrompt(args: {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string | null;
  company?: string | null;
  profileSkills?: string[];
}): string {
  return `Analyze resume vs job description. Produce weighted match analysis — NOT simple keyword counting.

Job Title: ${args.jobTitle ?? "Not specified"}
Company: ${args.company ?? "Not specified"}
Profile Skills (from structured profile): ${(args.profileSkills ?? []).join(", ") || "None"}

Return JSON:
{
  "overallMatch": {
    "score": number 0-100,
    "summary": "2-3 sentences explaining weighted fit",
    "methodology": "brief explanation of how dimensions were weighted",
    "dimensions": [
      {
        "dimension": "technical_skills|domain_experience|years_of_experience|education|certifications|industry_experience|leadership|communication|responsibilities|achievements|business_impact",
        "score": number 0-100,
        "weight": number 0-1,
        "explanation": "evidence-based explanation"
      }
    ]
  },
  "strengths": [
    { "title": string, "evidence": "quote or paraphrase from resume", "whyItMatters": string }
  ],
  "missingSkills": {
    "critical": [{ "skill": string, "explanation": string, "howToDemonstrateIfYouHaveIt": string }],
    "important": [{ "skill": string, "explanation": string, "howToDemonstrateIfYouHaveIt": string }],
    "niceToHave": [{ "skill": string, "explanation": string, "howToDemonstrateIfYouHaveIt": string }]
  }
}

Include 3-6 strengths and 2-4 items per missing-skills tier where relevant.

Job Description:
${args.jobDescription}

Resume:
${args.resumeText}`;
}

export const RESUME_RECRUITER_PROMPT_ID = "resume-recruiter-v1";

export function buildResumeRecruiterUserPrompt(args: {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string | null;
}): string {
  return `Analyze resume for recruiter perspective and section-level improvements.

Job Title: ${args.jobTitle ?? "Not specified"}

Return JSON:
{
  "recruiterExpectations": [
    { "expectation": string, "whyRecruitersCare": string, "howCandidatesDemonstrate": string }
  ],
  "resumeImprovements": [
    {
      "section": "summary|experience|skills|projects|education|certifications|achievements",
      "currentObservation": string,
      "whyItMatters": string,
      "recommendation": string,
      "exampleGuidance": "guidance only — never fake content to copy"
    }
  ],
  "recruiterView": {
    "standsOut": string[],
    "concerns": string[],
    "wouldShortlist": boolean,
    "shortlistReasoning": string,
    "missingEvidence": string[],
    "proofRequested": string[]
  },
  "honestyCheck": {
    "authenticityScore": number 0-100,
    "overallAssessment": string,
    "issues": [
      { "issue": string, "evidence": string, "recommendation": string, "severity": "low|medium|high" }
    ]
  }
}

Provide 3-5 recruiter expectations, improvements for each relevant section, and honesty issues if any.

Job Description:
${args.jobDescription}

Resume:
${args.resumeText}`;
}

export const COACHING_PROMPT_ID = "coaching-v1";

export function buildCoachingUserPrompt(args: {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string | null;
}): string {
  return `Generate coaching questions and career guidance. Do NOT write achievements — ask questions to help the user discover their own.

Job Title: ${args.jobTitle ?? "Not specified"}

Return JSON:
{
  "achievementDiscovery": [
    { "question": string, "context": "why this matters for the role", "relatedGap": string }
  ],
  "interviewReadiness": [
    { "question": string, "whyTheyMightAsk": string, "relatedGap": string, "preparationTip": string }
  ],
  "careerInsights": {
    "immediate": [{ "item": string, "type": "skill|certification|project|course", "rationale": string }],
    "threeMonths": [{ "item": string, "type": "skill|certification|project|course", "rationale": string }],
    "sixMonths": [{ "item": string, "type": "skill|certification|project|course", "rationale": string }],
    "longTerm": [{ "item": string, "type": "skill|certification|project|course", "rationale": string }]
  }
}

Generate 5-8 achievement discovery questions tailored to the JD gaps.
Generate 4-6 likely interview questions.
Only recommend learning/certifications/projects if genuinely relevant to gaps.

Job Description:
${args.jobDescription}

Resume:
${args.resumeText}`;
}

export const ATS_KEYWORDS_PROMPT_ID = "ats-keywords-v1";

export function buildAtsKeywordsUserPrompt(args: {
  resumeText: string;
  jobDescription: string;
  deterministicKeywords: string[];
}): string {
  return `Analyze ATS compatibility and keyword alignment. Supplement deterministic keyword list with contextual analysis.

Deterministic keywords extracted: ${args.deterministicKeywords.join(", ") || "none"}

Return JSON:
{
  "atsAnalysis": {
    "overallScore": number 0-100,
    "sectionOrder": string,
    "formattingNotes": string,
    "readabilityNotes": string,
    "lengthAssessment": string,
    "indicators": [
      { "category": string, "status": "good|warning|critical", "observation": string, "recommendation": string }
    ]
  },
  "keywordIntelligence": {
    "extractedFromJd": string[],
    "summary": string,
    "comparison": [
      {
        "keyword": string,
        "status": "present|missing|weak|overused",
        "explanation": string,
        "resumeEvidence": string|null
      }
    ]
  }
}

Cover: section order, formatting, readability, length, bullet quality, keyword distribution, action verbs, consistency, dates, contact info.
Include 10-20 important JD keywords in comparison.

Job Description:
${args.jobDescription}

Resume:
${args.resumeText}`;
}
