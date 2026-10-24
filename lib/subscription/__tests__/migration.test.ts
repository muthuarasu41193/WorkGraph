import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const sql = readFileSync(
  join(root, "supabase/migrations/20261024183000_subscription_guard_and_usage.sql"),
  "utf8",
);
const notes = readFileSync(join(root, "docs/ARCHITECTURE_NOTES.md"), "utf8");

describe("subscription guard migration", () => {
  it("starts with an explanation and is safe to re-run", () => {
    assert.match(sql, /^-- Lock plan columns/);
    assert.match(sql, /create table if not exists public\.feature_usage/i);
    assert.match(sql, /create index if not exists/i);
    assert.match(sql, /drop policy if exists feature_usage_select_own/i);
    assert.match(sql, /drop trigger if exists profiles_guard_subscription_columns/i);
    assert.match(sql, /create or replace function public\.guard_profile_subscription_columns/i);
  });

  it("locks plan columns unless the request role is service_role", () => {
    assert.match(sql, /before insert or update on public\.profiles/i);
    assert.match(sql, /auth\.role\(\)/);
    assert.match(sql, /request\.jwt\.claims/);
    assert.match(sql, /service_role/);
    assert.match(sql, /subscription_tier is distinct from old\.subscription_tier/);
    assert.match(sql, /subscription_expires_at is distinct from old\.subscription_expires_at/);
    assert.match(sql, /subscription_columns_locked/);
  });

  it("lets the owner read feature_usage and gives authenticated users no write policy", () => {
    assert.match(sql, /enable row level security/i);
    assert.match(sql, /feature in \('cover_letter', 'tailoring', 'talent_intelligence', 'ats_score'\)/);
    assert.match(sql, /using \(auth\.uid\(\) = user_id\)/);
    assert.match(sql, /references auth\.users \(id\) on delete cascade/);
    assert.match(sql, /\(user_id, feature, created_at desc\)/);
    assert.doesNotMatch(sql, /on public\.feature_usage for insert/i);
    assert.doesNotMatch(sql, /on public\.feature_usage for update/i);
    assert.doesNotMatch(sql, /on public\.feature_usage for delete/i);
  });

  it("lists feature_usage for the Prompt 4 delete and export work", () => {
    assert.match(notes, /`feature_usage`/);
    assert.match(notes, /Prompt 4/);
    assert.match(notes, /lib\/account\//);
  });
});
