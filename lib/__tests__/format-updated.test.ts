import assert from "node:assert/strict"
import test from "node:test"
import { formatExactLocalTime, formatUpdatedRelative } from "../format-updated"

test("formatUpdatedRelative uses minute buckets for recent stamps", () => {
  const now = Date.parse("2026-11-05T12:00:00.000Z")
  const iso = "2026-11-05T11:47:00.000Z"
  const label = formatUpdatedRelative(iso, now, "en")
  assert.match(label ?? "", /Updated/)
  assert.match(label ?? "", /13 minutes ago|13 minutes/)
})

test("formatUpdatedRelative rejects bad input", () => {
  assert.equal(formatUpdatedRelative(null), null)
  assert.equal(formatUpdatedRelative("not-a-date"), null)
})

test("formatExactLocalTime returns a locale date-time string", () => {
  const label = formatExactLocalTime("2026-11-05T11:47:00.000Z", "en-GB")
  assert.ok(label)
  assert.doesNotMatch(label!, /T|Z/)
})
