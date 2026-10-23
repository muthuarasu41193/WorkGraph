import assert from "node:assert/strict"
import test from "node:test"
import { parseOfflineQueue } from "../offline-queue"

test("parseOfflineQueue keeps status updates and drops anything else", () => {
  const raw = JSON.stringify([
    { id: "1", kind: "application-status", applicationId: "1", status: "interview", label: "Move" },
    { id: "2", kind: "resume", applicationId: "2", status: "applied", label: "Save" },
    { id: "3", kind: "application-status" },
  ])
  const items = parseOfflineQueue(raw)
  assert.equal(items.length, 1)
  assert.equal(items[0]?.status, "interview")
})

test("parseOfflineQueue returns an empty list for bad input", () => {
  assert.deepEqual(parseOfflineQueue(null), [])
  assert.deepEqual(parseOfflineQueue("{"), [])
})
