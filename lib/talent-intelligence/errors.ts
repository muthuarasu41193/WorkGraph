/** User-friendly messages for Talent Intelligence API failures. */

export type TalentIntelligenceErrorCode =
  | "RATE_LIMIT"
  | "LLM_ERROR"
  | "CONFIG_ERROR"
  | "UNKNOWN";

export function isGroqRateLimitError(error: unknown): boolean {
  if (error && typeof error === "object") {
    const status = (error as { status?: number }).status;
    if (status === 429) return true;
    const code = (error as { error?: { code?: string } }).error?.code;
    if (code === "rate_limit_exceeded") return true;
  }
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("429") || message.includes("rate_limit");
}

export function parseGroqRetryAfterMs(error: unknown): number {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/try again in ([\d.]+)s/i);
  if (match?.[1]) {
    return Math.ceil(parseFloat(match[1]) * 1000) + 500;
  }
  return 10_000;
}

export function formatTalentIntelligenceError(error: unknown): {
  message: string;
  code: TalentIntelligenceErrorCode;
  status: number;
  retryAfterSec?: number;
} {
  if (isGroqRateLimitError(error)) {
    const retryMs = parseGroqRetryAfterMs(error);
    const retrySec = Math.ceil(retryMs / 1000);
    return {
      message: `Our AI service is temporarily busy (rate limit). Please wait about ${retrySec} seconds and try again.`,
      code: "RATE_LIMIT",
      status: 429,
      retryAfterSec: retrySec,
    };
  }

  const raw = error instanceof Error ? error.message : String(error);
  if (raw.includes("Missing required environment variable: GROQ_API_KEY")) {
    return {
      message: "Resume Intelligence is not configured on this server. Contact support.",
      code: "CONFIG_ERROR",
      status: 503,
    };
  }

  if (raw.includes("Could not parse JSON")) {
    return {
      message: "Analysis completed but the response was malformed. Please try again.",
      code: "LLM_ERROR",
      status: 502,
    };
  }

  return {
    message: "Resume Intelligence analysis failed. Please try again in a moment.",
    code: "UNKNOWN",
    status: 500,
  };
}
