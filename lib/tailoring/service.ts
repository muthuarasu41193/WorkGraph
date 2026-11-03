/**
 * One Groq call (plus one retry on invalid JSON), then verify. Injectable for tests.
 */
import { getGroqClient, GROQ_MODEL } from "@/lib/groq";
import { parseAssistantJsonObject } from "@/lib/parseAssistantJson";
import { extractJobRequirements, jobRequirementTexts } from "@/lib/job-requirements";

import { buildTailoringUserPrompt, TAILORING_PROMPT_ID, TAILORING_SYSTEM_PROMPT } from "./prompt";
import {
  buildSourceLines,
  formatSourceLinesForPrompt,
  sourceLineMap,
  truncateJobText,
  type SourceDocument,
} from "./source";
import {
  tryParseTailoringModelJson,
  verifyTailoringResponse,
  type VerifiedTailoringResult,
} from "./verify";

export type TailoringCompletion = (args: {
  system: string;
  user: string;
}) => Promise<string>;

export type RunTailoringParams = {
  resumeText: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  profileSkills?: string[];
  complete?: TailoringCompletion;
};

export type TailoringRunResult = VerifiedTailoringResult & {
  source: SourceDocument;
  promptId: string;
  attempts: number;
};

async function defaultComplete(args: { system: string; user: string }): Promise<string> {
  const groq = getGroqClient();
  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: args.system },
      { role: "user", content: args.user },
    ],
  });
  return response.choices[0]?.message?.content ?? "{}";
}

function parseAndVerify(
  content: string,
  source: SourceDocument,
  profileSkills: string[] | undefined,
): VerifiedTailoringResult {
  const parsedUnknown = parseAssistantJsonObject(content);
  const parsed = tryParseTailoringModelJson(parsedUnknown);
  if (!parsed.ok) {
    throw parsed.error;
  }
  return verifyTailoringResponse(parsed.value, {
    sourceById: sourceLineMap(source),
    profileSkills,
  });
}

/**
 * Happy path: exactly one Groq call. Retries once if JSON/Zod parse fails.
 */
export async function runEvidenceTailoring(params: RunTailoringParams): Promise<TailoringRunResult> {
  const complete = params.complete ?? defaultComplete;
  const source = buildSourceLines(params.resumeText);
  const jobDescription = truncateJobText(params.jobDescription);
  const requirements = jobRequirementTexts(
    extractJobRequirements(jobDescription, {
      title: params.jobTitle,
      company: params.company,
    }),
  );

  const user = buildTailoringUserPrompt({
    sourceLinesBlock: formatSourceLinesForPrompt(source),
    jobTitle: params.jobTitle,
    company: params.company,
    jobDescription,
    requirements,
    profileSkills: params.profileSkills,
  });

  let attempts = 0;
  let lastError: unknown;

  while (attempts < 2) {
    attempts += 1;
    try {
      const content = await complete({ system: TAILORING_SYSTEM_PROMPT, user });
      const verified = parseAndVerify(content, source, params.profileSkills);
      return {
        ...verified,
        source,
        promptId: TAILORING_PROMPT_ID,
        attempts,
      };
    } catch (error) {
      lastError = error;
      if (attempts >= 2) break;
    }
  }

  throw lastError ?? new Error("Tailoring failed after retry.");
}
