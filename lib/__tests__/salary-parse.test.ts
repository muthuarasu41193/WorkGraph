import assert from "node:assert/strict"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, it } from "node:test"

import { SalaryDisplay, salaryText } from "../../components/product/SalaryDisplay"
import { TrustIndicator } from "../../components/product/TrustIndicator"
import { parseStatedSalary, statedPaySortKey, statedSalaryFilterMeta } from "../salary-parse"
import { visibleRiskFlags, riskFlags } from "../job-risk"

const STATED: Array<{ text: string; kind: "range" | "single"; currency: string; period: string }> = [
  { text: "₹12-18 LPA", kind: "range", currency: "INR", period: "per year" },
  { text: "INR 12,00,000 - 18,00,000", kind: "range", currency: "INR", period: "per year" },
  { text: "12 to 18 lakhs per annum", kind: "range", currency: "INR", period: "per year" },
  { text: "$120,000-$150,000", kind: "range", currency: "USD", period: "per year" },
  { text: "$60/hr", kind: "single", currency: "USD", period: "per hour" },
  { text: "€50k-€60k", kind: "range", currency: "EUR", period: "per year" },
  { text: "£40,000 - £55,000", kind: "range", currency: "GBP", period: "per year" },
  { text: "Salary: $95,000 per year", kind: "single", currency: "USD", period: "per year" },
  { text: "USD 80k to 100k", kind: "range", currency: "USD", period: "per year" },
  { text: "₹18 LPA", kind: "single", currency: "INR", period: "per year" },
  { text: "Compensation: €70,000 per annum", kind: "single", currency: "EUR", period: "per year" },
  { text: "$45/hour", kind: "single", currency: "USD", period: "per hour" },
  { text: "Rs. 6,00,000 - Rs. 9,00,000", kind: "range", currency: "INR", period: "per year" },
  { text: "8 to 12 LPA", kind: "range", currency: "INR", period: "per year" },
  { text: "Pay is $25 to $30 per hour", kind: "range", currency: "USD", period: "per hour" },
]

const UNDISCLOSED = [
  "competitive",
  "as per industry standards",
  "5-8 years of experience",
  "team of 12-18 engineers",
  "120000",
  "100 employees",
  "salary commensurate with experience",
  "DOE",
  "great benefits and a fun team",
  "$120,000",
  "up to 18",
  "",
  "3+ years experience required",
  "market rate",
]

describe("parseStatedSalary", () => {
  it("reads explicit Indian and international amounts", () => {
    assert.ok(STATED.length >= 12)
    for (const sample of STATED) {
      const figure = parseStatedSalary(sample.text)
      assert.equal(figure.kind, sample.kind, sample.text)
      assert.equal(figure.currency, sample.currency, sample.text)
      assert.equal(figure.period, sample.period, sample.text)
      assert.equal(salaryText(figure), figure.label)
      assert.match(figure.label ?? "", /\d/)
    }
  })

  it("returns undisclosed for ambiguous text", () => {
    assert.ok(UNDISCLOSED.length >= 8)
    for (const text of UNDISCLOSED) {
      const figure = parseStatedSalary(text)
      assert.equal(figure.kind, "undisclosed", text)
      assert.equal(statedPaySortKey(figure), null, text)
    }
  })

  it("rejects a non-string the way it rejects an empty posting", () => {
    assert.equal(parseStatedSalary(undefined).kind, "undisclosed")
    assert.equal(parseStatedSalary(null).kind, "undisclosed")
  })

  it("keeps LPA in rupees and does not invent a yearly rate from an hourly figure", () => {
    const lpa = parseStatedSalary("₹12-18 LPA")
    assert.equal(lpa.kind, "range")
    if (lpa.kind === "range") {
      assert.equal(lpa.min, 1_200_000)
      assert.equal(lpa.max, 1_800_000)
    }
    const hourly = parseStatedSalary("$60/hr")
    assert.equal(statedPaySortKey(hourly), 60)
    const meta = statedSalaryFilterMeta(hourly)
    assert.equal(meta?.period, "hour")
    assert.equal(meta?.minK, 60)
    const annual = statedSalaryFilterMeta(parseStatedSalary("$120,000-$150,000"))
    assert.equal(annual?.minK, 120)
    assert.equal(annual?.maxK, 150)
    assert.equal(annual?.currency, "USD")
  })

  it("shows the posting's own words with a stated-in-posting label", () => {
    const html = renderToStaticMarkup(createElement(SalaryDisplay, { salary: parseStatedSalary("₹12-18 LPA") }))
    assert.match(html, /₹12-18 LPA \(stated in posting\)/)
    assert.match(html, /We show pay only when the posting states it/)
    assert.equal(html.includes("verified"), false)
  })

  it("uses warning colour only for a payment request and caps the card at two labels", () => {
    const flags = visibleRiskFlags(
      riskFlags({
        company: "",
        applyUrl: null,
        description: "Pay a registration fee. Join our talent pool.",
        postedAtIso: new Date(Date.now() - 90 * 86_400_000).toISOString(),
      }),
    )
    const html = renderToStaticMarkup(
      createElement(TrustIndicator, {
        tone: "caution",
        reason: flags.map((flag) => flag.explanation).join(" "),
        flags: flags.map((flag) => ({
          code: flag.code,
          label: flag.label,
          explanation: flag.explanation,
          warning: flag.code === "payment_requested",
        })),
      }),
    )
    assert.match(html, /Asks for payment/)
    assert.match(html, /border-caution/)
    assert.match(html, /Off-platform contact only|May be closed|Always-open wording|Company name missing|No apply link/)
    assert.equal(html.includes("verified"), false)
    const labels = ["Asks for payment", "Off-platform contact only", "May be closed", "Always-open wording", "Company name missing", "No apply link"]
    const shown = labels.filter((label) => html.includes(label))
    assert.equal(shown.length, 2)
    assert.equal(shown[0], "Asks for payment")
  })
})
