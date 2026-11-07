import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { jobCardView, STALE_AFTER_DAYS as feedStaleDays } from "../job-feed"
import { formatJobFreshness, formatJobPostedCompact } from "../job-freshness"
import { scoreJobCard } from "../job-match"
import { isJobStale, STALE_AFTER_DAYS } from "../job-staleness"
import type { RecommendedJobCard } from "../job-dashboard"

const NOW = Date.parse("2026-11-02T12:00:00.000Z")

function daysAgo(days: number): string {
  return new Date(NOW - days * 86_400_000).toISOString()
}

function card(days: number, description = "Build the product."): RecommendedJobCard {
  return {
    id: `job-${days}`,
    title: "Technical Recruiter",
    company: "Acme",
    location: "Remote",
    description,
    source: "greenhouse",
    matchLabel: "70% match · sourcing",
    postedAgo: `${days}d ago`,
    postedAtIso: daysAgo(days),
    kind: "listing",
    classification: "employer_hiring",
    isCommunity: false,
    matchedSkills: ["sourcing"],
    applyUrl: "https://boards.greenhouse.io/acme/jobs/1",
  }
}

describe("shared job staleness", () => {
  it("uses one 30 day threshold", () => {
    assert.equal(STALE_AFTER_DAYS, 30)
    assert.equal(feedStaleDays, 30)
  })

  it("shows the same stale state on the list, the freshness line, and the match rank", () => {
    for (const days of [10, 30, 31, 60, 139]) {
      const stale = isJobStale(daysAgo(days), NOW)
      const view = jobCardView(card(days), NOW)
      const freshness = formatJobFreshness(daysAgo(days), NOW)
      const scored = scoreJobCard(
        { title: "Technical Recruiter", description: "Technical recruiting and sourcing.", postedAtIso: daysAgo(days) },
        { skills: ["Technical recruiting", "Sourcing"], headline: "Technical Recruiter" },
        NOW,
      )
      assert.equal(view.stale, stale, `list ${days}`)
      assert.equal(view.freshness.status === "stale", stale, `freshness status ${days}`)
      assert.equal(Boolean(freshness?.includes("may no longer be open")), stale, `freshness copy ${days}`)
      assert.equal(scored.subScores.freshness === -40, stale, `match rank ${days}`)
    }
  })

  it("formats compact posted captions for job cards", () => {
    assert.equal(formatJobPostedCompact(daysAgo(0), NOW), "Posted today")
    assert.equal(formatJobPostedCompact(daysAgo(1), NOW), "Posted 1d ago")
    assert.equal(formatJobPostedCompact(daysAgo(2), NOW), "Posted 2d ago")
    assert.equal(formatJobPostedCompact(null, NOW), null)
  })

  it("parses stated pay inside the card view without a second lookup", () => {
    const view = jobCardView(card(3, "Compensation: $120,000-$150,000"), NOW)
    assert.equal(view.salary.kind, "range")
    if (view.salary.kind === "range") {
      assert.equal(view.salary.currency, "USD")
      assert.equal(view.salary.min, 120_000)
      assert.equal(view.salary.max, 150_000)
    }
    assert.equal(view.trust, undefined)
  })
})
