import { getGroqClient } from "@/lib/groq";
import { parseAssistantJsonObject } from "@/lib/parseAssistantJson";
import { GROQ_MODEL } from "@/lib/groq";

export const TALENT_INTELLIGENCE_MODEL = GROQ_MODEL;

export type LlmRunMeta = {
  model: string;
  promptId: string;
  durationMs: number;
};

export async function runTalentIntelligencePrompt<T>(args: {
  promptId: string;
  system: string;
  user: string;
  temperature?: number;
}): Promise<{ data: T; meta: LlmRunMeta }> {
  const groq = getGroqClient();
  const started = Date.now();

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
    },
  };
}
