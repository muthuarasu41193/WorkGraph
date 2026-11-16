import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { ACCOUNT_TABLES } from "../../account/data-map.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const migrationPath = join(root, "supabase/migrations/20261112120000_prep_packs.sql");

describe("prep_packs RLS and account deletion wiring", () => {
  it("migration enables owner-only RLS policies", () => {
    const sql = readFileSync(migrationPath, "utf8");
    assert.match(sql, /enable row level security/i);
    assert.match(sql, /prep_packs_select_own/);
    assert.match(sql, /prep_packs_insert_own/);
    assert.match(sql, /prep_packs_update_own/);
    assert.match(sql, /prep_packs_delete_own/);
    assert.match(sql, /auth\.uid\(\)\s*=\s*user_id/);
    assert.match(sql, /revoke all on table public\.prep_packs from public, anon/i);
    assert.match(sql, /grant select, insert, update, delete on table public\.prep_packs to authenticated/i);
    // Raw JD must not be a column.
    assert.equal(/job_description/i.test(sql), false);
    assert.equal(/create table[\s\S]*job_description/i.test(sql), false);
  });

  it("lists prep_packs in the account deletion/export map", () => {
    const entry = ACCOUNT_TABLES.find((row) => row.table === "prep_packs");
    assert.ok(entry);
    assert.equal(entry?.ownerColumn, "user_id");
    assert.equal(entry?.deleteStrategy, "delete");
    assert.equal(entry?.export, true);
  });
});

describe("prep_pack_shares RLS and account deletion wiring", () => {
  const shareMigration = join(root, "supabase/migrations/20261116120000_prep_pack_shares.sql");

  it("migration stores hashed tokens only with owner RLS", () => {
    const sql = readFileSync(shareMigration, "utf8");
    assert.match(sql, /create table if not exists public\.prep_pack_shares/i);
    assert.match(sql, /token_hash/);
    assert.match(sql, /enable row level security/i);
    assert.match(sql, /prep_pack_shares_select_own/);
    assert.match(sql, /prep_pack_shares_insert_own/);
    assert.match(sql, /prep_pack_shares_update_own/);
    assert.match(sql, /auth\.uid\(\)\s*=\s*owner_id/);
    assert.match(sql, /revoke all on table public\.prep_pack_shares from public, anon/i);
    assert.equal(/\braw_token\b/i.test(sql), false);
    assert.equal(/create table[\s\S]*\btoken text/i.test(sql), false);
  });

  it("lists prep_pack_shares in the account deletion/export map", () => {
    const entry = ACCOUNT_TABLES.find((row) => row.table === "prep_pack_shares");
    assert.ok(entry);
    assert.equal(entry?.ownerColumn, "owner_id");
    assert.equal(entry?.deleteStrategy, "delete");
    assert.equal(entry?.export, true);
  });
});

