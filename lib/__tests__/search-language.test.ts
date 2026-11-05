import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { queryLooksNonLatin } from "../search-language"

describe("queryLooksNonLatin", () => {
  it("treats Latin queries as Latin", () => {
    assert.equal(queryLooksNonLatin("staff engineer"), false)
    assert.equal(queryLooksNonLatin("São Paulo designer"), false)
  })

  it("detects Tamil and Devanagari queries", () => {
    assert.equal(queryLooksNonLatin("மென்பொருள்"), true)
    assert.equal(queryLooksNonLatin("सॉफ्टवेयर इंजीनियर"), true)
  })
})
