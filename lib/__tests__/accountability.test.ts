import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

import {
  APPLY_SAFETY_NOTICE,
  LISTING_REPORT_CONFIRMATION,
  LISTING_REPORT_REASONS,
  PRIVACY_SUMMARY_POINTS,
} from "../accountability"

describe("accountability copy", () => {
  it("keeps the apply safety notice exact", () => {
    assert.equal(APPLY_SAFETY_NOTICE, "WorkGraph never asks for payment or ID numbers.")
  })

  it("lists report reasons and a next-step confirmation", () => {
    assert.ok(LISTING_REPORT_REASONS.length >= 4)
    assert.match(LISTING_REPORT_CONFIRMATION, /person will review/i)
  })

  it("ships a plain-language privacy summary", () => {
    assert.ok(PRIVACY_SUMMARY_POINTS.length >= 3)
  })

  it("stores listing reports in Supabase via migration", () => {
    const sql = readFileSync(
      new URL("../../supabase/migrations/20261105120000_job_listing_reports.sql", import.meta.url),
      "utf8",
    )
    assert.match(sql, /create table if not exists public\.job_listing_reports/i)
    assert.match(sql, /service_role/)
  })
})
