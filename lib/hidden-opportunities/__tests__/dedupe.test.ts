import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dedupeOpportunities, titleSimilarity } from "../dedupe";
import type { HiddenOpportunity } from "../types";

function opp(partial: Partial<HiddenOpportunity> & Pick<HiddenOpportunity, "id" | "title" | "url">): HiddenOpportunity {
  return {
    source: "reddit",
    postedAt: new Date().toISOString(),
    tags: [],
    score: 10,
    ...partial,
  };
}

describe("titleSimilarity", () => {
  it("returns high score for near-identical titles", () => {
    const score = titleSimilarity(
      "Senior React Engineer - Remote",
      "Senior React Engineer Remote",
    );
    assert.ok(score >= 0.8);
  });

  it("returns low score for unrelated titles", () => {
    const score = titleSimilarity("Barista morning shift", "Kubernetes platform engineer");
    assert.ok(score < 0.3);
  });
});

describe("dedupeOpportunities", () => {
  it("removes same URL duplicates keeping higher score", () => {
    const input = [
      opp({ id: "a", title: "Engineer", url: "https://example.com/job/1", score: 5 }),
      opp({ id: "b", title: "Engineer copy", url: "https://example.com/job/1/", score: 40 }),
    ];
    const result = dedupeOpportunities(input);
    assert.equal(result.length, 1);
    assert.equal(result[0]?.id, "b");
  });

  it("removes similar titles at same company", () => {
    const input = [
      opp({
        id: "a",
        title: "Remote Backend Engineer",
        url: "https://a.com",
        company: "Acme",
        score: 10,
      }),
      opp({
        id: "b",
        title: "Backend Engineer Remote",
        url: "https://b.com",
        company: "Acme",
        score: 20,
      }),
    ];
    const result = dedupeOpportunities(input);
    assert.equal(result.length, 1);
  });
});
