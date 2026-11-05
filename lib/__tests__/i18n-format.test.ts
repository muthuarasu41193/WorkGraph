import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { formatCurrency, formatDate, formatNumber } from "../i18n/format"
import { foldDiacritics, searchTextMatches } from "../i18n/search-normalize"

describe("i18n formatters", () => {
  it("formats numbers and currency by locale", () => {
    assert.match(formatNumber(1234.5, "en"), /1,234/)
    assert.match(formatCurrency(10, "en", "USD"), /\$10/)
    assert.ok(formatCurrency(10, "hi", "INR").length > 0)
  })

  it("formats dates by locale", () => {
    const value = formatDate("2026-11-05T12:00:00Z", "en", { dateStyle: "medium", timeZone: "UTC" })
    assert.match(value, /2026/)
  })
})

describe("search normalize", () => {
  it("folds Latin diacritics", () => {
    assert.equal(foldDiacritics("São"), "Sao")
    assert.equal(searchTextMatches("Sao Paulo designer", "são"), true)
  })

  it("keeps non-Latin queries usable", () => {
    assert.equal(searchTextMatches("மென்பொருள் பொறியாளர்", "மென்பொருள்"), true)
    assert.equal(searchTextMatches("software engineer", "मென்"), false)
  })
})
