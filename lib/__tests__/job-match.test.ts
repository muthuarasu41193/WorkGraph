import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatJobFreshness } from "../job-freshness";
import { PROFILE_MATCH_MIN_PERCENT, scoreJobCard } from "../job-match";

const NOW = Date.parse("2026-10-23T12:00:00.000Z");

/** Representative recruiting profile. The owner's production profile is not available in this environment. */
const RECRUITER = {
  skills: [
    "Technical recruiting",
    "Talent acquisition",
    "Sourcing",
    "Boolean search",
    "Applicant tracking systems",
    "Stakeholder management",
    "Interviewing",
    "Offer negotiation",
    "LinkedIn Recruiter",
  ],
  headline: "Technical Recruiter",
  summary:
    "Recruiting for engineering and product teams. Full-cycle talent acquisition, stakeholder management, and offer negotiation.",
};

function daysAgo(days: number): string {
  return new Date(NOW - days * 86_400_000).toISOString();
}

describe("scoreJobCard reweight", () => {
  it("scores Chief Engineer below 40% for a recruiting skill set", () => {
    const scored = scoreJobCard(
      {
        title: "Chief Engineer",
        description:
          "Lead the engineering organization. 15+ years building distributed systems, hiring engineers, and setting technical direction.",
        postedAtIso: daysAgo(10),
      },
      RECRUITER,
      NOW,
    );
    assert.ok(scored.matchPercent < PROFILE_MATCH_MIN_PERCENT);
    assert.equal(scored.matchedSkills.length, 0);
    assert.equal(scored.subScores.skillOverlap, 0);
    assert.ok(scored.subScores.seniority < scored.subScores.skillOverlap + 8);
  });

  it("ranks skill overlap and title family above seniority", () => {
    const chief = scoreJobCard(
      {
        title: "Chief Engineer",
        description: "Own architecture and mentor senior staff engineers.",
        postedAtIso: daysAgo(2),
      },
      RECRUITER,
      NOW,
    );
    const recruiter = scoreJobCard(
      {
        title: "Senior Technical Recruiter",
        description:
          "Full-cycle technical recruiting, sourcing, boolean search, and offer negotiation in our applicant tracking system.",
        postedAtIso: daysAgo(2),
      },
      RECRUITER,
      NOW,
    );
    assert.ok(recruiter.matchPercent >= PROFILE_MATCH_MIN_PERCENT);
    assert.ok(recruiter.matchPercent > chief.matchPercent);
    assert.ok(recruiter.subScores.skillOverlap > recruiter.subScores.seniority);
    assert.ok(recruiter.subScores.titleFamily > recruiter.subScores.seniority);
    assert.ok(recruiter.score > chief.score);
  });

  it("ranks a job older than 30 days below the same role posted recently", () => {
    const fresh = scoreJobCard(
      {
        title: "Technical Recruiter",
        description: "Technical recruiting and sourcing for product teams.",
        postedAtIso: daysAgo(1),
      },
      RECRUITER,
      NOW,
    );
    const stale = scoreJobCard(
      {
        title: "Technical Recruiter",
        description: "Technical recruiting and sourcing for product teams.",
        postedAtIso: daysAgo(139),
      },
      RECRUITER,
      NOW,
    );
    assert.ok(fresh.score > stale.score);
    assert.ok(stale.matchPercent <= fresh.matchPercent);
    assert.equal(formatJobFreshness(daysAgo(139), NOW), "Posted 139 days ago, may no longer be open");
  });
});
