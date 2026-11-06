import assert from "node:assert/strict"
import test from "node:test"
import { normalizeCompanyNameRules, peelLegalSuffix } from "../normalize-rules"
import { INDEX_COMPANY_NAME_CASES } from "./fixtures-from-index"

test("fixture list has at least 30 real index examples", () => {
  assert.ok(INDEX_COMPANY_NAME_CASES.length >= 30)
})

test("peels stuck LLC / Inc / Ltd / GmbH / Corp suffixes", () => {
  assert.deepEqual(peelLegalSuffix("Sharkninjaoperatingllc"), {
    body: "Sharkninjaoperating",
    suffix: "LLC",
  })
  assert.equal(peelLegalSuffix("acmeinc").suffix, "INC")
  assert.equal(peelLegalSuffix("northwindltd").suffix, "LTD")
  assert.equal(peelLegalSuffix("datasensegmbh").suffix, "GmbH")
  assert.equal(peelLegalSuffix("globexcorp").suffix, "CORP")
})

for (const fixture of INDEX_COMPANY_NAME_CASES) {
  test(`rules: ${fixture.raw}`, () => {
    const result = normalizeCompanyNameRules(fixture.raw)
    assert.equal(result.displayName, fixture.expect)
    if (fixture.confident != null) {
      assert.equal(result.confident, fixture.confident)
    }
  })
}

test("falls back shape for empty input", () => {
  const result = normalizeCompanyNameRules("  ")
  assert.equal(result.displayName, "")
  assert.equal(result.confident, false)
})
