import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAnalyticsBody, parseHiddenJobsQuery } from "../validation";

describe("parseHiddenJobsQuery", () => {
  it("parses filters from search params", () => {
    const params = new URLSearchParams({
      q: "engineer",
      source: "github",
      remote: "true",
      country: "US",
      postedWithinDays: "7",
      sort: "newest",
      limit: "50",
    });
    const query = parseHiddenJobsQuery(params);
    assert.equal(query.q, "engineer");
    assert.equal(query.source, "github");
    assert.equal(query.remote, true);
    assert.equal(query.country, "US");
    assert.equal(query.postedWithinDays, 7);
    assert.equal(query.sort, "newest");
    assert.equal(query.limit, 50);
  });

  it("rejects invalid source", () => {
    const params = new URLSearchParams({ source: "linkedin" });
    const query = parseHiddenJobsQuery(params);
    assert.equal(query.source, undefined);
  });
});

describe("parseAnalyticsBody", () => {
  it("accepts valid analytics payload", () => {
    const parsed = parseAnalyticsBody({
      opportunityId: "reddit:forhire:abc",
      event: "click",
      source: "reddit",
    });
    assert.ok(!("error" in parsed));
    if (!("error" in parsed)) {
      assert.equal(parsed.event, "click");
    }
  });

  it("rejects invalid event", () => {
    const parsed = parseAnalyticsBody({ opportunityId: "x", event: "share" });
    assert.ok("error" in parsed);
  });
});
