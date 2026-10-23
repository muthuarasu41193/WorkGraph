import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { namedApplyLabel, parseMatchPercent, relaxQuery, remotePolicy, sortFeedJobs } from "../job-feed"
import type { RecommendedJobCard } from "../job-dashboard"

function job(partial: Partial<RecommendedJobCard> & Pick<RecommendedJobCard, "id" | "matchLabel">): RecommendedJobCard {
  return {
    title: "Role",
    company: "Acme",
    location: "Remote",
    description: "",
    source: "greenhouse",
    postedAgo: "Today",
    postedAtIso: null,
    kind: "listing",
    classification: "employer_hiring",
    isCommunity: false,
    matchedSkills: [],
    ...partial,
  }
}

describe("job feed helpers", () => {
  it("parses a real match percent and ignores unscored labels", () => {
    assert.equal(parseMatchPercent("72% match · sql"), 72)
    assert.equal(parseMatchPercent("Acme · via greenhouse"), null)
  })

  it("names the apply destination without using Apply Now", () => {
    assert.equal(namedApplyLabel("greenhouse", true), "Apply on Greenhouse")
    assert.equal(namedApplyLabel("other", true), "Apply on the company site")
    assert.equal(namedApplyLabel("greenhouse", false), "Apply on the company site")
  })

  it("relaxes a query by one token or one character", () => {
    assert.equal(relaxQuery("staff engineer"), "staff")
    assert.equal(relaxQuery("enginer"), "engine")
    assert.equal(relaxQuery("ab"), null)
  })

  it("does not invent a remote policy", () => {
    assert.equal(remotePolicy("Berlin, Germany"), "Listed location")
    assert.equal(remotePolicy("Remote - US"), "Remote")
    assert.equal(remotePolicy("Location TBD"), "Remote policy not listed")
  })

  it("sorts by parsed match and leaves unscored rows last", () => {
    const sorted = sortFeedJobs(
      [job({ id: "a", matchLabel: "10% match · a" }), job({ id: "b", matchLabel: "No score" }), job({ id: "c", matchLabel: "80% match · c" })],
      "match",
    )
    assert.deepEqual(sorted.map((row) => row.id), ["c", "a", "b"])
  })
})
