import assert from "node:assert/strict"
import test from "node:test"
import { countedAtLabel, thinCoverageNote } from "../credibility"

test("thin coverage names the real result count and stops above the cap", () => {
  assert.match(thinCoverageNote(0) ?? "", /no roles/)
  assert.match(thinCoverageNote(1) ?? "", /1 role/)
  assert.match(thinCoverageNote(4) ?? "", /4 roles/)
  assert.equal(thinCoverageNote(5), null)
  assert.equal(thinCoverageNote(null), null)
})

test("countedAtLabel uses the timestamp it is given", () => {
  assert.equal(countedAtLabel("2026-10-23T14:05:00.000Z"), "Counted at 2026-10-23 14:05 UTC, when this page was rendered.")
  assert.equal(countedAtLabel(null), null)
  assert.equal(countedAtLabel("not-a-date"), null)
})
