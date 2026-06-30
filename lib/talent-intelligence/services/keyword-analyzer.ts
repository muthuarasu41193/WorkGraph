import { scoreJobRow } from "@/lib/job-match";
import type { KeywordIntelligence, KeywordItem, KeywordStatus } from "../types";
import { asString } from "../utils";

const TECH_KEYWORD_PATTERNS = [
  /\b(?:react|vue|angular|svelte)\b/gi,
  /\b(?:node\.?js|express|nestjs|fastify)\b/gi,
  /\b(?:python|django|flask|fastapi)\b/gi,
  /\b(?:java|spring|kotlin)\b/gi,
  /\b(?:typescript|javascript|golang|rust|ruby|php|c\+\+|c#)\b/gi,
  /\b(?:aws|azure|gcp|kubernetes|docker|terraform)\b/gi,
  /\b(?:postgres|postgresql|mysql|mongodb|redis|graphql)\b/gi,
  /\b(?:machine learning|ml|deep learning|nlp|llm|ai)\b/gi,
  /\b(?:agile|scrum|ci\/cd|devops|sre)\b/gi,
  /\b(?:sql|nosql|data (?:engineer|science|analyst))\b/gi,
];

function extractKeywords(text: string): string[] {
  const found = new Set<string>();
  for (const pattern of TECH_KEYWORD_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      for (const m of matches) {
        found.add(m.toLowerCase().replace(/\s+/g, " "));
      }
    }
  }

  const bulletSkills = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) ?? [];
  for (const skill of bulletSkills.slice(0, 30)) {
    if (skill.length >= 3 && skill.length <= 30) {
      found.add(skill.toLowerCase());
    }
  }

  return [...found].slice(0, 40);
}

function countOccurrences(text: string, keyword: string): number {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = text.match(new RegExp(escaped, "gi"));
  return matches?.length ?? 0;
}

function findEvidence(resumeText: string, keyword: string): string | null {
  const lines = resumeText.split(/\n/);
  const lower = keyword.toLowerCase();
  for (const line of lines) {
    if (line.toLowerCase().includes(lower)) {
      return line.trim().slice(0, 200);
    }
  }
  return null;
}

function classifyKeyword(
  jdCount: number,
  resumeCount: number,
  evidence: string | null,
): KeywordStatus {
  if (resumeCount === 0 && !evidence) return "missing";
  if (resumeCount >= 5) return "overused";
  if (resumeCount >= 1 && resumeCount <= 2 && jdCount >= 2) return "weak";
  if (evidence || resumeCount >= 1) return "present";
  return "missing";
}

/**
 * KeywordAnalyzer — deterministic keyword extraction and comparison.
 */
export function analyzeKeywords(resumeText: string, jobDescription: string): KeywordIntelligence {
  const jdKeywords = extractKeywords(jobDescription);
  const resumeLower = resumeText.toLowerCase();

  const comparison: KeywordItem[] = jdKeywords.map((keyword) => {
    const jdCount = countOccurrences(jobDescription, keyword);
    const resumeCount = countOccurrences(resumeLower, keyword);
    const evidence = findEvidence(resumeText, keyword);
    const status = classifyKeyword(jdCount, resumeCount, evidence);

    const explanations: Record<KeywordStatus, string> = {
      present: `Resume mentions "${keyword}" — aligns with job requirements.`,
      missing: `Job description emphasizes "${keyword}". If you have this experience, describe where you used it.`,
      weak: `"${keyword}" appears in your resume but could be strengthened with specific context.`,
      overused: `"${keyword}" appears frequently — ensure each mention is backed by concrete evidence.`,
    };

    return {
      keyword,
      status,
      explanation: explanations[status],
      resumeEvidence: evidence,
    };
  });

  const present = comparison.filter((c) => c.status === "present").length;
  const missing = comparison.filter((c) => c.status === "missing").length;

  return {
    extractedFromJd: jdKeywords,
    comparison,
    summary: `Found ${jdKeywords.length} key terms in the job description. ${present} are present in your resume, ${missing} are missing or weak.`,
  };
}

/** Skill overlap score 0-100 using existing job-match primitives. */
export function computeSkillOverlapScore(
  jobDescription: string,
  profileSkills: string[],
  resumeSnippet?: string,
): number {
  const row = {
    id: 0,
    external_id: "ti-temp",
    title: "Role",
    company: "Company",
    location: "",
    description: jobDescription,
    apply_url: "",
    posted_at: null,
    source: "manual",
    kind: null,
    classification: null,
    is_community: null,
  };
  const result = scoreJobRow(row, {
    skills: profileSkills,
    headline: null,
    summary: resumeSnippet ?? null,
  });
  return result.matchPercent;
}
