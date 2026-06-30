import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatTalentIntelligenceError,
  isGroqRateLimitError,
  parseGroqRetryAfterMs,
} from "../errors.ts";

describe("talent-intelligence errors", () => {
  it("detects Groq rate limit errors", () => {
    const err = new Error(
      '429 {"error":{"code":"rate_limit_exceeded","message":"Please try again in 8.905s"}}',
    );
    assert.equal(isGroqRateLimitError(err), true);
  });

  it("parses retry-after from Groq message", () => {
    const err = new Error("Rate limit reached. Please try again in 8.905s.");
    assert.equal(parseGroqRetryAfterMs(err), 9405);
  });

  it("formats user-friendly rate limit message", () => {
    const err = new Error("429 rate_limit_exceeded Please try again in 10s.");
    const formatted = formatTalentIntelligenceError(err);
    assert.equal(formatted.code, "RATE_LIMIT");
    assert.equal(formatted.status, 429);
    assert.match(formatted.message, /temporarily busy/i);
    assert.ok(formatted.retryAfterSec);
  });
});
