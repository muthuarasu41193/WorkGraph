import { z } from "zod";

import { getGroqClient, GROQ_MODEL } from "@/lib/groq";
import { LIMITS } from "@/lib/validation/primitives";

import { findUngroundedClaims, formatClaimWarning, type GroundingFlag } from "./grounding";

export type GenerateCoverLetterParams = {
  jobTitle: string;
  company: string;
  jobDescription: string;
  resumeText: string;
};

export type GeneratedCoverLetter = {
  letter: string;
  warnings: string[];
};

export type CoverLetterMessage = {
  role: "system" | "user";
  content: string;
};

export type CoverLetterCompletion = (input: {
  messages: CoverLetterMessage[];
  temperature: number;
}) => Promise<string>;

/**
 * Honesty lines reused from lib/talent-intelligence/prompts/index.ts.
 * That prompt file is intentionally unchanged. The JSON-only instruction
 * from Talent Intelligence does not apply to a prose letter.
 */
export const COVER_LETTER_SYSTEM_PROMPT = `You write cover letters for WorkGraph. You are an honest career coach.

Use ONLY facts present in the candidate's resume text. Never invent employers, titles, dates, metrics, skills, certifications or achievements. If the job asks for something the resume does not show, do not claim it; write at most one sentence of genuine interest instead.

NEVER invent, fabricate, or suggest adding experience the candidate does not have.
NEVER encourage keyword stuffing or lying.
Every sentence must be helpful, honest, evidence-based, educational, and professional.

Return only the letter. Do not return JSON.`;

/** First draft. Must stay at or below 0.4. */
export const COVER_LETTER_TEMPERATURE = 0.4;

/** Stricter revision after a grounding flag. Must stay at or below 0.4. */
export const COVER_LETTER_REVISION_TEMPERATURE = 0.2;

const coverLetterDraftSchema = z.string().trim().min(1).max(LIMITS.coverLetter);

function boundedTemperature(temperature: number): number {
  if (!Number.isFinite(temperature) || temperature < 0 || temperature > 0.4) {
    throw new Error("Cover letter generation temperature must be 0.4 or lower.");
  }
  return temperature;
}

function readDraft(raw: string): string {
  const clipped = raw.trim().slice(0, LIMITS.coverLetter);
  const parsed = coverLetterDraftSchema.safeParse(clipped);
  if (!parsed.success) {
    throw new Error("Cover letter generation returned an empty response. Please try again.");
  }
  return parsed.data;
}

export function buildCoverLetterUserMessage(
  params: GenerateCoverLetterParams,
  revisionNote?: string,
): string {
  const revision = revisionNote
    ? `\nRevision required:\n${revisionNote}\nDo not mention this review note in the letter.\n`
    : "";
  return [
    `Write a cover letter for the ${params.jobTitle} position at ${params.company}.`,
    "",
    "Job description:",
    params.jobDescription,
    "",
    "Candidate resume text (the only source of employers, titles, dates, metrics, skills, certifications, and achievements):",
    params.resumeText,
    "",
    "Write in first person, in 3 or 4 paragraphs, in a professional tone. Return only the letter.",
    revision,
  ].join("\n");
}

function revisionNote(flags: readonly GroundingFlag[]): string {
  const claims = flags.map((flag) => flag.claim).join(", ");
  return `Remove these unsupported claims: ${claims}. Use ONLY facts present in the candidate's resume text. Never invent employers, titles, dates, metrics, skills, certifications or achievements. If the job asks for something the resume does not show, do not claim it; write at most one sentence of genuine interest instead.`;
}

function messagesFor(
  params: GenerateCoverLetterParams,
  note?: string,
): CoverLetterMessage[] {
  return [
    { role: "system", content: COVER_LETTER_SYSTEM_PROMPT },
    { role: "user", content: buildCoverLetterUserMessage(params, note) },
  ];
}

async function completeWithGroq(input: {
  messages: CoverLetterMessage[];
  temperature: number;
}): Promise<string> {
  const groq = getGroqClient();
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: boundedTemperature(input.temperature),
    max_tokens: 1500,
    messages: input.messages,
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

export async function generateCoverLetter(
  params: GenerateCoverLetterParams,
  complete: CoverLetterCompletion = completeWithGroq,
): Promise<GeneratedCoverLetter> {
  const jobTitle = params.jobTitle.trim();
  const company = params.company.trim();
  const jobDescription = params.jobDescription.trim();
  const resumeText = params.resumeText.trim();

  if (!jobTitle || !company || !resumeText) {
    throw new Error(
      "Cover letter generation requires a job title, company, and candidate background.",
    );
  }

  const groundedParams: GenerateCoverLetterParams = {
    jobTitle,
    company,
    jobDescription,
    resumeText,
  };
  const sources = {
    resumeText,
    jobDescription,
    roleContext: `${company}\n${jobTitle}`,
  };

  try {
    const first = readDraft(
      await complete({
        messages: messagesFor(groundedParams),
        temperature: boundedTemperature(COVER_LETTER_TEMPERATURE),
      }),
    );
    let letter = first;
    let flags = findUngroundedClaims(letter, sources);

    if (flags.length > 0) {
      letter = readDraft(
        await complete({
          messages: messagesFor(groundedParams, revisionNote(flags)),
          temperature: boundedTemperature(COVER_LETTER_REVISION_TEMPERATURE),
        }),
      );
      flags = findUngroundedClaims(letter, sources);
    }

    const warning = formatClaimWarning(flags);
    return { letter, warnings: warning ? [warning] : [] };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Cover letter generation")) {
      throw error;
    }

    const raw = error instanceof Error ? error.message : "Unknown error";
    if (raw.includes("GROQ_API_KEY")) {
      throw new Error("Cover letter generation is not configured on this server.");
    }

    throw new Error("Cover letter generation failed. Please try again.");
  }
}
