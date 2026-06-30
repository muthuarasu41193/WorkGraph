import { getGroqClient } from "@/lib/groq";
import { parseAssistantJsonObject } from "@/lib/parseAssistantJson";
import { GROQ_MODEL } from "@/lib/groq";
import { isGroqRateLimitError, parseGroqRetryAfterMs } from "../errors";

export const TALENT_INTELLIGENCE_MODEL = GROQ_MODEL;

/** Pause between chained prompts to stay under Groq TPM on free/on-demand tiers. */
export const PROMPT_CHAIN_DELAY_MS = 3_000;

const MAX_RETRIES = 4;

export type LlmRunMeta = {
  model: string;
  promptId: string;
  durationMs: number;
  attempts: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runTalentIntelligencePrompt<T>(args: {
  promptId: string;
  system: string;
  user: string;
  temperature?: number;
}): Promise<{ data: T; meta: LlmRunMeta }> {
  const groq = getGroqClient();
  const started = Date.now();
  let attempts = 0;
  let lastError: unknown;

  while (attempts < MAX_RETRIES) {
    attempts += 1;
    try {
      const response = await groq.chat.completions.create({
        model: TALENT_INTELLIGENCE_MODEL,
        temperature: args.temperature ?? 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: args.system },
          { role: "user", content: args.user },
        ],
      });

      const content = response.choices[0]?.message?.content ?? "{}";
      const parsed = parseAssistantJsonObject(content) as T;

      return {
        data: parsed,
        meta: {
          model: TALENT_INTELLIGENCE_MODEL,
          promptId: args.promptId,
          durationMs: Date.now() - started,
          attempts,
        },
      };
    } catch (error) {
      lastError = error;
      if (isGroqRateLimitError(error) && attempts < MAX_RETRIES) {
        const waitMs = parseGroqRetryAfterMs(error);
        await sleep(waitMs);
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("LLM request failed after retries.");
}
