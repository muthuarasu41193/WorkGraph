import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { JobRow } from "../../job-dashboard.ts";
import { findAlertMatches, isPaymentRequestedJob } from "../match.ts";

function job(partial: Partial<JobRow> & Pick<JobRow, "id" | "title">): JobRow {
  return {
    id: partial.id,
    external_id: partial.external_id ?? `ext-${partial.id}`,
    title: partial.title,
    company: partial.company ?? "Acme",
    location: partial.location ?? "Remote",
    description: partial.description ?? "React TypeScript engineer",
    apply_url: partial.apply_url ?? "https://example.com",
    posted_at: partial.posted_at !== undefined ? partial.posted_at : "2026-11-01T12:00:00.000Z",
    source: partial.source ?? "greenhouse",
    kind: partial.kind ?? "listing",
    classification: partial.classification ?? null,
    is_community: partial.is_community ?? false,
    payment_requested: partial.payment_requested,
  };
}

describe("isPaymentRequestedJob", () => {
  it("excludes only rows flagged payment_requested", () => {
    assert.equal(isPaymentRequestedJob(job({ id: 1, title: "A" })), false);
    assert.equal(isPaymentRequestedJob(job({ id: 2, title: "B", payment_requested: false })), false);
    assert.equal(isPaymentRequestedJob(job({ id: 3, title: "C", payment_requested: true })), true);
  });
});

describe("findAlertMatches", () => {
  const since = new Date("2026-10-25T00:00:00.000Z");

  it("applies min_match only when a profile is present", async () => {
    const rows = [
      job({
        id: 1,
        title: "React Engineer",
        description: "Build React apps with TypeScript",
        posted_at: "2026-10-28T00:00:00.000Z",
      }),
      job({
        id: 2,
        title: "Gardener",
        description: "Water plants outdoors",
        posted_at: "2026-10-28T00:00:00.000Z",
      }),
    ];

    const withProfile = await findAlertMatches(
      { query: "q=engineer", min_match: 40 },
      { skills: ["React", "TypeScript"], headline: "Frontend engineer" },
      since,
      async () => rows,
    );
    assert.ok(withProfile.some((m) => m.id === "ext-1"));
    assert.equal(
      withProfile.some((m) => m.id === "ext-2"),
      false,
      "low-overlap gardener should be filtered by min_match",
    );

    const withoutProfile = await findAlertMatches(
      { query: "", min_match: 90 },
      null,
      since,
      async () => rows,
    );
    assert.equal(withoutProfile.length, 2, "without a profile, min_match is not applied");
  });

  it("respects since and excludes older postings", async () => {
    const rows = [
      job({ id: 1, title: "New Role", posted_at: "2026-10-28T00:00:00.000Z" }),
      job({ id: 2, title: "Old Role", posted_at: "2026-10-01T00:00:00.000Z" }),
      job({ id: 3, title: "No date", posted_at: null }),
    ];
    const matches = await findAlertMatches(
      { query: "", min_match: 0 },
      null,
      since,
      async () => rows,
    );
    assert.deepEqual(
      matches.map((m) => m.id),
      ["ext-1"],
    );
  });

  it("excludes payment_requested jobs and caps at 10", async () => {
    const rows: JobRow[] = [];
    for (let i = 1; i <= 15; i += 1) {
      rows.push(
        job({
          id: i,
          title: `React Role ${i}`,
          description: "React TypeScript",
          posted_at: "2026-10-28T00:00:00.000Z",
          payment_requested: i === 3 ? true : false,
        }),
      );
    }
    const matches = await findAlertMatches(
      { query: "", min_match: 0 },
      { skills: ["React"] },
      since,
      async () => rows,
    );
    assert.equal(matches.length, 10);
    assert.equal(
      matches.some((m) => m.id === "ext-3"),
      false,
    );
  });

  it("runs a single catalog fetch per call", async () => {
    let calls = 0;
    await findAlertMatches({ query: "q=react&src=greenhouse", min_match: 40 }, { skills: ["React"] }, since, async () => {
      calls += 1;
      return [];
    });
    assert.equal(calls, 1);
  });
});
