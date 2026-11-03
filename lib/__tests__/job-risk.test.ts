import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { asksForPayment, riskFlags, visibleRiskFlags, type JobRiskInput } from "../job-risk"
import { STALE_AFTER_DAYS } from "../job-staleness"

const NOW = Date.parse("2026-11-02T12:00:00.000Z")

function daysAgo(days: number): string {
  return new Date(NOW - days * 86_400_000).toISOString()
}

function listing(partial: JobRiskInput): JobRiskInput {
  return {
    title: "Engineer",
    company: "Acme",
    description: "Build the product.",
    applyUrl: "https://boards.greenhouse.io/acme/jobs/1",
    postedAtIso: daysAgo(2),
    now: NOW,
    ...partial,
  }
}

function codes(input: JobRiskInput): string[] {
  return riskFlags(input).map((flag) => flag.code)
}

describe("riskFlags", () => {
  it("flags a payment request and ignores denials", () => {
    assert.equal(asksForPayment("Pay a registration fee of ₹500 to continue."), true)
    assert.equal(asksForPayment("Registration charges apply before the interview."), true)
    assert.equal(asksForPayment("Security deposit required before joining."), true)
    assert.equal(asksForPayment("You must pay to apply."), true)
    assert.equal(asksForPayment("No fees charged."), false)
    assert.equal(asksForPayment("We do not charge any application fee."), false)
    assert.equal(asksForPayment("There are no registration charges."), false)
    assert.equal(asksForPayment("The application fee is waived."), false)
    assert.ok(codes(listing({ description: "Pay a registration fee of ₹500." })).includes("payment_requested"))
    assert.equal(codes(listing({ description: "No fees charged. Salary is competitive." })).includes("payment_requested"), false)
  })

  it("flags off-platform contact only when it is the only way to apply", () => {
    const whatsapp = codes(
      listing({
        description: "Message the founder on WhatsApp to apply.",
        applyUrl: null,
        isCommunity: true,
        source: "reddit",
      }),
    )
    assert.ok(whatsapp.includes("offplatform_only"))
    assert.equal(
      codes(
        listing({
          description: "Questions on WhatsApp. Apply on the company site.",
          applyUrl: "https://boards.greenhouse.io/acme/jobs/1",
        }),
      ).includes("offplatform_only"),
      false,
    )
    assert.ok(
      codes(
        listing({
          description: "Send a resume to jane.doe@gmail.com",
          applyUrl: "https://www.reddit.com/r/forhire/comments/abc",
          isCommunity: true,
          source: "reddit",
        }),
      ).includes("offplatform_only"),
    )
    assert.equal(
      codes(listing({ description: "Email careers@acme.com with a resume.", applyUrl: null })).includes("offplatform_only"),
      false,
    )
  })

  it("flags evergreen wording, a missing company, and a missing apply link", () => {
    assert.ok(codes(listing({ description: "Join our talent pool for future openings." })).includes("evergreen_language"))
    assert.ok(codes(listing({ title: "We are always hiring" })).includes("evergreen_language"))
    assert.ok(codes(listing({ company: "Company" })).includes("missing_company"))
    assert.ok(codes(listing({ company: "" })).includes("missing_company"))
    assert.ok(codes(listing({ applyUrl: null })).includes("missing_apply_url"))
    assert.ok(codes(listing({ applyUrl: "  " })).includes("missing_apply_url"))
  })

  it("uses the shared staleness threshold and shows at most two labels", () => {
    assert.equal(codes(listing({ postedAtIso: daysAgo(STALE_AFTER_DAYS) })).includes("stale"), false)
    assert.ok(codes(listing({ postedAtIso: daysAgo(STALE_AFTER_DAYS + 1) })).includes("stale"))
    const flags = riskFlags(
      listing({
        company: "",
        applyUrl: null,
        description: "Pay a registration fee. We are always hiring. WhatsApp only.",
        postedAtIso: daysAgo(90),
        isCommunity: true,
      }),
    )
    assert.deepEqual(
      flags.map((flag) => flag.code),
      ["payment_requested", "offplatform_only", "stale", "evergreen_language", "missing_company", "missing_apply_url"],
    )
    const shown = visibleRiskFlags(flags)
    assert.equal(shown.length, 2)
    assert.equal(shown[0]?.code, "payment_requested")
    assert.equal(shown[1]?.code, "offplatform_only")
    assert.match(shown[0]?.explanation ?? "", /fee|deposit|registration/i)
  })

  it("does not treat a client user id as permission to hide a flag", () => {
    const flags = riskFlags({
      ...listing({ description: "Pay a registration fee of ₹500.", company: "", applyUrl: null }),
      userId: "someone-else",
    } as JobRiskInput & { userId: string })
    assert.equal(flags[0]?.code, "payment_requested")
    assert.ok(flags.some((flag) => flag.code === "missing_company"))
    assert.ok(flags.some((flag) => flag.code === "missing_apply_url"))
  })

  it("treats a non-string description as empty text", () => {
    const flags = riskFlags({
      ...listing({ company: "Acme", applyUrl: "https://example.com/jobs/1" }),
      description: 120000 as unknown as string,
    })
    assert.equal(flags.some((flag) => flag.code === "payment_requested"), false)
    assert.equal(flags.some((flag) => flag.code === "missing_company"), false)
  })
})
