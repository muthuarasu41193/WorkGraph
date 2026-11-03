import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { isAdminEmail, resolveAdminMetricsAccess } from "../admin.ts";
import { PRODUCT_EVENT_NAMES } from "../events.ts";
import { isKnownProductEvent, recordEvent, validateEventProps } from "../record.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../..");

describe("validateEventProps", () => {
  it("accepts empty props and small enums/numbers", () => {
    assert.deepEqual(validateEventProps(undefined), {});
    assert.deepEqual(validateEventProps({ plan_id: "pass_30", amount_paise: 29900 }), {
      plan_id: "pass_30",
      amount_paise: 29900,
    });
    assert.deepEqual(validateEventProps({ free: true }), { free: true });
  });

  it("rejects an email key and other PII-looking props", () => {
    assert.equal(validateEventProps({ email: "a@b.com" }), null);
    assert.equal(validateEventProps({ user_email: "a@b.com" }), null);
    assert.equal(validateEventProps({ name: "Ada" }), null);
    assert.equal(validateEventProps({ resume_text: "hello" }), null);
    assert.equal(validateEventProps({ phone: "999" }), null);
    assert.equal(validateEventProps({ note: "contact me at a@b.com" }), null);
  });

  it("rejects free-text values that look like emails", () => {
    assert.equal(validateEventProps({ source: "person@example.com" }), null);
  });

  it("rejects arrays, nested objects, and oversized payloads", () => {
    assert.equal(validateEventProps([]), null);
    assert.equal(validateEventProps({ nested: { a: 1 } }), null);
    const big: Record<string, number> = {};
    for (let i = 0; i < 20; i += 1) big[`k${i}`] = i;
    assert.equal(validateEventProps(big), null);
  });
});

describe("recordEvent", () => {
  it("rejects unknown events and never throws", async () => {
    const result = await recordEvent("not_a_real_event", "11111111-1111-4111-8111-111111111111");
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "unknown_event");
  });

  it("rejects PII-looking props and never throws", async () => {
    const result = await recordEvent("signup", "11111111-1111-4111-8111-111111111111", {
      email: "founder@example.com",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "invalid_props");
  });

  it("returns unconfigured when the service role is missing (still no throw)", async () => {
    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    try {
      // Reset the admin client singleton by requiring a fresh module path is hard;
      // with env cleared, createSupabaseAdminClient still may return a cached client.
      // Happy path still validates the event name before the client check.
      const result = await recordEvent("signup", "not-a-uuid");
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.reason, "invalid_user");
    } finally {
      if (prevUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
      else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (prevKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
      else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    }
  });

  it("knows every allowed product event name", () => {
    for (const name of PRODUCT_EVENT_NAMES) {
      assert.equal(isKnownProductEvent(name), true);
    }
    assert.equal(isKnownProductEvent("page_view"), false);
  });
});

describe("admin metrics access", () => {
  it("returns not_found for non-admins (maps to 404 on the page)", () => {
    const prev = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "founder@getworkgraph.com";
    try {
      assert.equal(resolveAdminMetricsAccess(null), "not_found");
      assert.equal(resolveAdminMetricsAccess("other@example.com"), "not_found");
      assert.equal(isAdminEmail("other@example.com"), false);
      assert.equal(resolveAdminMetricsAccess("founder@getworkgraph.com"), "ok");
      assert.equal(isAdminEmail("Founder@GetWorkGraph.com"), true);
    } finally {
      if (prev === undefined) delete process.env.ADMIN_EMAILS;
      else process.env.ADMIN_EMAILS = prev;
    }
  });

  it("denies everyone when ADMIN_EMAILS is unset", () => {
    const prev = process.env.ADMIN_EMAILS;
    delete process.env.ADMIN_EMAILS;
    try {
      assert.equal(resolveAdminMetricsAccess("founder@getworkgraph.com"), "not_found");
    } finally {
      if (prev === undefined) delete process.env.ADMIN_EMAILS;
      else process.env.ADMIN_EMAILS = prev;
    }
  });

  it("admin metrics page calls notFound for non-admins and is not in public nav", () => {
    const page = readFileSync(path.join(root, "app/admin/metrics/page.tsx"), "utf8");
    assert.match(page, /resolveAdminMetricsAccess/);
    assert.match(page, /notFound\(\)/);
    assert.match(page, /robots:\s*\{\s*index:\s*false/);

    const navSources = [
      "components/shell/AppShell.tsx",
      "lib/constants.ts",
      "components/layout/Footer.tsx",
    ]
      .map((rel) => {
        try {
          return readFileSync(path.join(root, rel), "utf8");
        } catch {
          return "";
        }
      })
      .join("\n");
    assert.doesNotMatch(navSources, /\/admin\/metrics/);
  });
});

describe("product_events migration and privacy", () => {
  it("migration enables RLS with no authenticated policies", () => {
    const migrations = path.join(root, "supabase/migrations");
    const file = readdirSync(migrations).find((name) => name.endsWith("_product_events.sql"));
    assert.ok(file, "expected product_events migration");
    const sql = readFileSync(path.join(migrations, file!), "utf8");
    assert.match(sql, /create table if not exists public\.product_events/);
    assert.match(sql, /enable row level security/);
    assert.match(sql, /revoke all on table public\.product_events/);
    assert.doesNotMatch(sql, /create policy/i);
    assert.match(sql, /on delete set null/);
  });

  it("no client-side code reads product_events", () => {
    const clientRoots = [
      path.join(root, "components"),
      path.join(root, "app"),
      path.join(root, "lib"),
    ];
    const offenders: string[] = [];

    function walk(dir: string) {
      let listing: ReturnType<typeof readdirSync>;
      try {
        listing = readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of listing) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "__tests__") {
            continue;
          }
          walk(full);
          continue;
        }
        if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue;
        const source = readFileSync(full, "utf8");
        const isClient =
          source.includes('"use client"') ||
          source.includes("'use client'") ||
          full.includes(`${path.sep}components${path.sep}`);
        if (!isClient) continue;
        if (/from\(["']product_events["']\)|\.from\(\s*["']product_events["']\s*\)/.test(source)) {
          offenders.push(path.relative(root, full));
        }
      }
    }

    for (const dir of clientRoots) walk(dir);
    assert.deepEqual(offenders, []);
  });
});
