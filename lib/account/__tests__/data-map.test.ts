import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { ACCOUNT_TABLES, TABLES_WITHOUT_ACCOUNT_OWNER } from "../data-map.ts";
import { ownerColumnsByTable, stripSqlComments } from "../migration-owners.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const migrationsDir = join(root, "supabase/migrations");

function migrationFiles() {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(migrationsDir, name), "utf8"),
    }));
}

describe("account data map covers migration owner columns", () => {
  it("fails when a migration table has an owner column that is not listed", () => {
    const found = ownerColumnsByTable(migrationFiles());
    const listed = new Map(ACCOUNT_TABLES.map((entry) => [entry.table, entry]));

    for (const [table, columns] of found) {
      const entry = listed.get(table);
      assert.ok(
        entry,
        `${table} has owner column(s) ${[...columns].join(", ")} but is missing from lib/account/data-map.ts`,
      );
      assert.ok(
        columns.has(entry.ownerColumn),
        `${table} data map owner ${entry.ownerColumn} is not one of ${[...columns].join(", ")}`,
      );
    }

    for (const entry of ACCOUNT_TABLES) {
      const columns = found.get(entry.table);
      assert.ok(columns, `${entry.table} is in the data map but no migration gives it an owner column`);
      assert.equal(entry.export, true);
      assert.ok(entry.label.length > 0);
    }

    for (const table of TABLES_WITHOUT_ACCOUNT_OWNER) {
      assert.equal(found.has(table), false, `${table} gained an owner column and must be added to the data map`);
    }
  });

  it("ignores owner columns that appear only in SQL comments", () => {
    const found = ownerColumnsByTable([
      {
        name: "synthetic.sql",
        sql: `
          -- create table public.decoy (user_id uuid references auth.users);
          /* create table public.commented (owner_user_id uuid); */
          create table if not exists public.widget_prefs (
            id uuid primary key,
            user_id uuid references auth.users (id) on delete cascade
          );
          create table public.memberships (
            member_id uuid not null references auth.users (id)
          );
        `,
      },
    ]);
    assert.equal(found.has("decoy"), false);
    assert.equal(found.has("commented"), false);
    assert.deepEqual([...(found.get("widget_prefs") ?? [])].sort(), ["user_id"]);
    assert.deepEqual([...(found.get("memberships") ?? [])].sort(), ["member_id"]);
  });

  it("strips line comments before looking for tables", () => {
    const stripped = stripSqlComments("-- create table public.secret_notes (user_id uuid);\nselect 1;");
    assert.equal(/create\s+table/i.test(stripped), false);
  });
});

describe("account routes stay session scoped", () => {
  it("export and delete routes resolve the session and do not read a client user id", () => {
    const exportRoute = readFileSync(join(root, "app/api/account/export/route.ts"), "utf8");
    const deleteRoute = readFileSync(join(root, "app/api/account/delete/route.ts"), "utf8");
    for (const source of [exportRoute, deleteRoute]) {
      assert.match(source, /resolveAuthenticatedUserId\(session\)/);
      assert.match(source, /getSessionUser\(request\)/);
      assert.doesNotMatch(source, /searchParams/);
      assert.doesNotMatch(source, /user_id/);
    }
    assert.match(deleteRoute, /signOutServerSession/);
    assert.match(exportRoute, /ACCOUNT_EXPORT_LIMIT/);
  });
});

describe("privacy and settings copy matches the controls that exist", () => {
  it("describes download and deletion and does not claim a missing resume-delete control", () => {
    const privacy = readFileSync(join(root, "app/legal/privacy/page.tsx"), "utf8");
    const settings = readFileSync(join(root, "components/settings/SettingsSection.tsx"), "utf8");
    assert.match(privacy, /accountDataRights/);
    assert.match(privacy, /BACKUP_RETENTION_SENTENCE/);
    assert.doesNotMatch(privacy, /resume delete/i);
    assert.doesNotMatch(privacy, /disable personalized match scoring/i);
    assert.doesNotMatch(settings, /Export is not available/);
    assert.match(settings, /Download my data/);
    assert.match(settings, /Delete my account/);
    assert.match(settings, /variant="destructive"/);
  });
});
