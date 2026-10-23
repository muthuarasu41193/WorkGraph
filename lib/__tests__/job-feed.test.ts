import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { salaryText } from "../../components/product/SalaryDisplay"
import { jobCardView, namedApplyLabel, parseMatchPercent, relaxQuery, remotePolicy, sortFeedJobs } from "../job-feed"
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

  it("names the apply destination from the source, matching via {source}", () => {
    assert.equal(namedApplyLabel("greenhouse", "https://boards.greenhouse.io/acme"), "Apply on Greenhouse")
    assert.equal(namedApplyLabel("greenhouse", null), "Apply on Greenhouse")
    assert.equal(namedApplyLabel("workgraph", null, "Acme"), "Apply on Acme")
    assert.equal(
      namedApplyLabel("other", "https://boards.greenhouse.io/acme/jobs/1", "Acme"),
      "Apply on greenhouse.io",
    )
    const view = jobCardView(
      job({
        id: "host",
        matchLabel: "10% match · a",
        source: "other",
        company: "Acme",
        applyUrl: "https://www.greenhouse.io/acme",
      }),
    )
    assert.equal(view.applyLabel, "Apply on greenhouse.io")
    assert.equal(view.source.source, "greenhouse.io")
    assert.equal(view.applyLabel, `Apply on ${view.source.source}`)
    for (const label of [view.applyLabel, namedApplyLabel("other", null, "Acme"), namedApplyLabel("company", null, "Acme")]) {
      assert.equal(label.includes("Apply Now"), false)
      assert.equal(/company site/i.test(label), false)
    }
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

  it("keeps a stated salary and names an undisclosed one", () => {
    assert.equal(salaryText({ kind: "stated", label: "$120k–$150k" }), "$120k–$150k")
    assert.equal(salaryText({ kind: "stated", label: "  " }), "Salary not disclosed")
    assert.equal(salaryText({ kind: "undisclosed" }), "Salary not disclosed")
  })

  it("sorts by parsed match and leaves unscored rows last", () => {
    const sorted = sortFeedJobs(
      [job({ id: "a", matchLabel: "10% match · a" }), job({ id: "b", matchLabel: "No score" }), job({ id: "c", matchLabel: "80% match · c" })],
      "match",
    )
    assert.deepEqual(sorted.map((row) => row.id), ["c", "a", "b"])
  })
})
