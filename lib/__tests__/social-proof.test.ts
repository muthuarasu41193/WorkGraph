import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  CACHE_TTL_MS,
  EARLY_STAGE_COPY,
  MIN_DISPLAY_THRESHOLD,
  displayCount,
  filterConsentedTestimonials,
  getRealCounts,
  resetSocialProofCache,
  teamMemberDisclosure,
  type SocialProofQueries,
  type TestimonialRow,
} from "../social-proof";

afterEach(() => {
  resetSocialProofCache();
});

function stubStore(counts: {
  signups: number;
  publishedGuides: number;
  verifiedOutcomes: number;
}): SocialProofQueries & { calls: number } {
  const store = {
    calls: 0,
    async countSignups() {
      store.calls += 1;
      return counts.signups;
    },
    async countPublishedGuides() {
      return counts.publishedGuides;
    },
    async countVerifiedOutcomes() {
      return counts.verifiedOutcomes;
    },
  };
  return store;
}

describe("displayCount", () => {
  it("renders early-stage copy below the display threshold", () => {
    assert.equal(MIN_DISPLAY_THRESHOLD, 25);
    const low = displayCount(24);
    assert.equal(low.showNumber, false);
    assert.equal(low.display, EARLY_STAGE_COPY);
    assert.equal(low.display.includes("2,400"), false);
    assert.equal(low.display.includes("4.9"), false);
  });

  it("renders the real number at or above the threshold", () => {
    const ready = displayCount(25);
    assert.equal(ready.showNumber, true);
    assert.equal(ready.display, "25");
    assert.equal(displayCount(2400).display, "2,400");
  });
});

describe("filterConsentedTestimonials", () => {
  const rows: TestimonialRow[] = [
    {
      id: "1",
      author_name: "Ada",
      author_title: "Engineer",
      quote: "Helped me prep.",
      consent_given_at: "2026-09-01T00:00:00.000Z",
      is_employee: false,
      verified_outcome: "offer",
      source: "vault",
    },
    {
      id: "2",
      author_name: "Staff",
      author_title: "Founder",
      quote: "We built this.",
      consent_given_at: "2026-09-02T00:00:00.000Z",
      is_employee: true,
      verified_outcome: null,
      source: "internal",
    },
    {
      id: "3",
      author_name: "No Consent",
      author_title: "PM",
      quote: "Should never render.",
      consent_given_at: null,
      is_employee: false,
      verified_outcome: null,
      source: null,
    },
  ];

  it("drops rows without consent_given_at", () => {
    const visible = filterConsentedTestimonials(rows);
    assert.deepEqual(
      visible.map((row) => row.id),
      ["1", "2"],
    );
  });

  it("discloses WorkGraph team members", () => {
    assert.equal(teamMemberDisclosure(false), null);
    assert.equal(teamMemberDisclosure(true), "WorkGraph team member");
  });
});

describe("getRealCounts", () => {
  it("returns queried signup, published-guide, and verified-outcome counts", async () => {
    const store = stubStore({ signups: 3, publishedGuides: 1, verifiedOutcomes: 0 });
    const counts = await getRealCounts({ store, now: 0 });
    assert.deepEqual(counts, { signups: 3, publishedGuides: 1, verifiedOutcomes: 0 });
  });

  it("caches results for 10 minutes", async () => {
    const store = stubStore({ signups: 10, publishedGuides: 2, verifiedOutcomes: 1 });
    await getRealCounts({ store, now: 0 });
    await getRealCounts({ store, now: CACHE_TTL_MS - 1 });
    assert.equal(store.calls, 1);
    await getRealCounts({ store, now: CACHE_TTL_MS });
    assert.equal(store.calls, 2);
  });
});
