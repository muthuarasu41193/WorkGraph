import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scoreOpportunity, sortOpportunities } from "../ranking";
import type { HiddenOpportunity } from "../types";

describe("scoreOpportunity", () => {
  it("boosts remote and recent posts", () => {
    const recent = scoreOpportunity({
      id: "1",
      source: "reddit",
      title: "Hiring remote engineer worldwide — contract freelance",
      url: "https://example.com",
      postedAt: new Date().toISOString(),
    });
    const old = scoreOpportunity({
      id: "2",
      source: "reddit",
      title: "Office role",
      url: "https://example.com/2",
      postedAt: new Date(Date.now() - 90 * 86_400_000).toISOString(),
    });
    assert.ok(recent.score > old.score);
    assert.ok(recent.tags.includes("remote"));
  });
});

describe("sortOpportunities", () => {
  it("sorts by score when relevant", () => {
    const items: HiddenOpportunity[] = [
      {
        id: "a",
        source: "reddit",
        title: "A",
        url: "https://a",
        postedAt: new Date().toISOString(),
        tags: [],
        score: 5,
      },
      {
        id: "b",
        source: "reddit",
        title: "B",
        url: "https://b",
        postedAt: new Date().toISOString(),
        tags: [],
        score: 50,
      },
    ];
    const sorted = sortOpportunities(items, "relevant");
    assert.equal(sorted[0]?.id, "b");
  });
});
