import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildHomeStats,
  countApplicationsThisWeek,
  getProfileFirstName,
  getTimeGreeting,
} from "../home-dashboard";

describe("getProfileFirstName", () => {
  it("sentence-cases an all-caps first name", () => {
    assert.equal(getProfileFirstName({ full_name: "MUTHU ARASU", email: null }), "Muthu");
  });

  it("falls back to sentence-cased email local part", () => {
    assert.equal(getProfileFirstName({ full_name: null, email: "MUTHU@example.com" }), "Muthu");
  });
});

describe("getTimeGreeting", () => {
  it("returns morning before noon", () => {
    assert.equal(getTimeGreeting(new Date("2026-01-01T08:00:00")), "Good morning");
  });
});

describe("countApplicationsThisWeek", () => {
  it("counts applications within the last 7 calendar days", () => {
    const now = new Date(2026, 2, 10, 12, 0, 0);
    const count = countApplicationsThisWeek(
      [
        { applied_date: "2026-03-10" },
        { applied_date: "2026-03-04" },
        { applied_date: "2026-03-03" },
        { applied_date: "2026-02-01" },
      ],
      now,
    );
    assert.equal(count, 2);
  });
});

describe("buildHomeStats", () => {
  it("uses matchedListings as the newMatches source", () => {
    const stats = buildHomeStats({
      matchedListings: 147,
      pipeline: { applied: 3, interview: 1, offers: 0, saved: 2 },
      hiddenTotal: 9,
      wallet: null,
      followUpsDue: 4,
      applicationsThisWeek: 2,
    });
    assert.equal(stats.newMatches, 147);
    assert.equal(stats.followUpsDue, 4);
    assert.equal(stats.applicationsThisWeek, 2);
  });
});
