import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { PRODUCT_EVENT_NAMES } from "../../metrics/events.ts";
import { validateEventProps } from "../../metrics/record.ts";
import { eventSafeId, vaultGuideFreshnessBucket } from "../freshness.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const MILESTONE_D_EVENTS = [
  "prep_pack_started",
  "prep_pack_completed",
  "vault_guide_clicked",
  "vault_return_visit",
  "vault_guide_freshness",
  "vault_contributor_earnings",
] as const;

describe("Milestone D product events", () => {
  it("registers validation events in PRODUCT_EVENT_NAMES", () => {
    for (const name of MILESTONE_D_EVENTS) {
      assert.ok(PRODUCT_EVENT_NAMES.includes(name), `missing ${name}`);
    }
  });

  it("accepts ID/category-only props and rejects PII", () => {
    const ok = validateEventProps({
      guide_id: eventSafeId("11111111-1111-4111-8111-111111111111"),
      category: "vault_guide",
      age_bucket: "fresh_30d",
      gross_inr: 499,
      fee_inr: 125,
      net_inr: 374,
      fee_bps: 2500,
      sales_count: 1,
    });
    assert.ok(ok);
    assert.equal(ok?.guide_id?.includes("-"), false);

    assert.equal(validateEventProps({ resume: "secret cv text" }), null);
    assert.equal(validateEventProps({ job_description: "build apis" }), null);
    assert.equal(validateEventProps({ email: "a@b.com" }), null);
    assert.equal(validateEventProps({ jd: "paste of a job" }), null);
    assert.equal(
      validateEventProps({
        notes: "candidate phone 999 and resume attached",
      }),
      null,
    );
  });

  it("maps interview dates to freshness buckets without storing guide text", () => {
    const now = Date.parse("2026-11-16T00:00:00.000Z");
    assert.equal(vaultGuideFreshnessBucket("2026-11-01", now), "fresh_30d");
    assert.equal(vaultGuideFreshnessBucket("2026-09-01", now), "aging_90d");
    assert.equal(vaultGuideFreshnessBucket("2026-06-01", now), "stale_180d");
    assert.equal(vaultGuideFreshnessBucket("2025-01-01", now), "stale_365d");
    assert.equal(vaultGuideFreshnessBucket(null, now), "unknown");
  });

  it("migration expands the product_events allow-list", () => {
    const migrations = path.join(root, "supabase/migrations");
    const file = readdirSync(migrations).find((name) => name.includes("monetization_readiness"));
    assert.ok(file, "expected monetization_readiness migration");
    const sql = readFileSync(path.join(migrations, file!), "utf8");
    for (const name of MILESTONE_D_EVENTS) {
      assert.match(sql, new RegExp(`'${name}'`));
    }
    assert.match(sql, /payment_status = 'verified'/);
  });
});
