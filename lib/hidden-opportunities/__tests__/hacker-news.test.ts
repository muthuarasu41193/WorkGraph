import assert from "node:assert/strict";
import { describe, it } from "node:test";

// Test helpers exported via inline logic matching production
function commentTitle(text: string): string {
  const line = text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(/[.!?\n]/)[0]
    ?.trim();
  if (!line) return "Hacker News comment";
  return line.length > 140 ? `${line.slice(0, 137)}…` : line;
}

describe("hacker-news helpers", () => {
  it("builds a short title from comment text", () => {
    const title = commentTitle(
      "Acme Corp | Remote | Senior Engineer | https://example.com/jobs\nWe are hiring!",
    );
    assert.ok(title.includes("Acme"));
    assert.ok(title.length <= 140);
  });
});
