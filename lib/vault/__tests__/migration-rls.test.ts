import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const root = join(import.meta.dirname, "../../..");
const migrationPath = join(
  root,
  "supabase/migrations/20261113120000_vault_milestone_b_relevance_trust.sql",
);

describe("vault milestone B migration RLS", () => {
  it("adds organization, freshness, attestation, and reports with reporter-only select", () => {
    const sql = readFileSync(migrationPath, "utf8");
    assert.match(sql, /add column if not exists skills/);
    assert.match(sql, /add column if not exists interview_round/);
    assert.match(sql, /add column if not exists content_confirmed_at/);
    assert.match(sql, /add column if not exists attestation_accepted_at/);
    assert.match(sql, /add column if not exists removed_at/);
    assert.match(sql, /create table if not exists public\.vault_guide_reports/);
    assert.match(sql, /vault_guide_reports_insert_own/);
    assert.match(sql, /vault_guide_reports_select_own/);
    assert.match(sql, /auth\.uid\(\) = reporter_id/);
    assert.match(sql, /inaccessible_after_purchase/);
    assert.match(sql, /materially_misrepresented/);
    assert.match(sql, /under_review/);
    assert.doesNotMatch(sql, /create policy.*vault_guide_reports.*update/i);
  });
});
