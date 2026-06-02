import Groq from "groq-sdk";
import { parseAssistantJsonObject } from "@/lib/parseAssistantJson";

export const RESUME_ANALYZER_MODEL = "llama-3.3-70b-versatile";

export type ResumeAnalysis = {
  atsScore: number;
  matchScore: number | null;
  strengths: string[];
  improvements: string[];
  missingKeywords: string[];
  tips: string[];
  summary: string;
};

type AnalyzeArgs = {
  resumeText: string;
  targetRole?: string;
  jobDescription?: string;
};

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing required environment variable: GROQ_API_KEY");
  }
  return new Groq({ apiKey });
}

function clampScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function normalizeStringList(value: unknown, min = 3, max = 5): string[] {
  const list = Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  return list.slice(0, max).length >= min ? list.slice(0, max) : list.slice(0, max);
}

function normalizeSummary(value: unknown): string {
  if (typeof value !== "string") return "Your resume has a workable base with clear room to improve ATS alignment.";
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return "Your resume has a workable base with clear room to improve ATS alignment.";
  return normalized;
}

function normalizeAnalysis(raw: unknown, hasJobDescription: boolean): ResumeAnalysis {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    atsScore: clampScore(obj.atsScore),
    matchScore: hasJobDescription ? clampScore(obj.matchScore) : null,
    strengths: normalizeStringList(obj.strengths),
    improvements: normalizeStringList(obj.improvements),
    missingKeywords: normalizeStringList(obj.missingKeywords, 3, 8),
    tips: normalizeStringList(obj.tips, 3, 6),
    summary: normalizeSummary(obj.summary),
  };
}

export async function analyzeResumeWithGroq(args: AnalyzeArgs): Promise<ResumeAnalysis> {
  const groq = getGroqClient();
  const hasJobDescription = Boolean(args.jobDescription?.trim());

  const response = await groq.chat.completions.create({
    model: RESUME_ANALYZER_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an ATS and resume reviewer. Return advisory suggestions only. Never rewrite resume lines, never provide replacement text, and never output modified resume content. Keep feedback actionable, concise, and safe.",
      },
      {
        role: "user",
        content: `Analyze this resume as advisory feedback only.

Rules:
- Suggestions only; do not rewrite or regenerate any resume section.
- Do not include "replacement text", "rewrite", or "copy this line" style output.
- Output STRICT JSON only with these keys:
{
  "atsScore": number 0-100,
  "matchScore": number 0-100 or null,
  "strengths": string[3..5],
  "improvements": string[3..5],
  "missingKeywords": string[3..8],
  "tips": string[3..6],
  "summary": "exactly 2 sentences"
}

Target Role: ${args.targetRole?.trim() || "Not provided"}
Job Description: ${args.jobDescription?.trim() || "Not provided"}

Resume:
${args.resumeText.slice(0, 24000)}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = parseAssistantJsonObject(content);
  return normalizeAnalysis(parsed, hasJobDescription);
}

