import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { resolveSubscriptionStatus } from "../../subscription/index.ts";
import {
  ALERT_MAX_PER_USER,
  alertCreateSchema,
  alertFrequencySchema,
  alertUpdateSchema,
  withAlertCreateDefaults,
} from "../../validation/alerts.ts";
import { AlertsApiError, assertAlertFrequencyAllowed, normalizeAlertQuery } from "../server.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("alert validation", () => {
  it("rejects an invalid frequency", () => {
    const parsed = alertFrequencySchema.safeParse("monthly");
    assert.equal(parsed.success, false);
    assert.equal(alertCreateSchema.safeParse({ name: "A", query: "q=x", frequency: "hourly" }).success, false);
  });

  it("accepts daily weekly off with defaults", () => {
    const created = withAlertCreateDefaults(
      alertCreateSchema.parse({ name: "Remote React", query: "q=react&locMode=remote" }),
    );
    assert.equal(created.frequency, "weekly");
    assert.equal(created.discreet, true);
    assert.equal(created.min_match, 40);
    assert.equal(ALERT_MAX_PER_USER, 10);
    assert.equal(alertUpdateSchema.safeParse({ frequency: "daily" }).success, true);
    assert.equal(alertUpdateSchema.safeParse({}).success, false);
  });

  it("caps name and query length", () => {
    assert.equal(alertCreateSchema.safeParse({ name: "x".repeat(81), query: "" }).success, false);
    assert.equal(alertCreateSchema.safeParse({ name: "ok", query: "q=".padEnd(501, "a") }).success, false);
  });
});

describe("daily frequency requires an active pass", () => {
  it("rejects daily for free users and allows it for an active pass", async () => {
    const free = resolveSubscriptionStatus({ subscription_tier: "free" }, false);
    await assert.rejects(
      () =>
        assertAlertFrequencyAllowed("11111111-1111-4111-8111-111111111111", "daily", {
          readSubscription: async () => free,
        }),
      (err: unknown) => err instanceof AlertsApiError && err.status === 403,
    );

    await assertAlertFrequencyAllowed("11111111-1111-4111-8111-111111111111", "weekly", {
      readSubscription: async () => free,
    });

    const active = resolveSubscriptionStatus(
      { subscription_tier: "premium", subscription_expires_at: "2030-01-01T00:00:00.000Z" },
      false,
      new Date("2026-11-02T00:00:00.000Z"),
    );
    await assertAlertFrequencyAllowed("11111111-1111-4111-8111-111111111111", "daily", {
      readSubscription: async () => active,
    });
  });
});

describe("alert API stays session scoped", () => {
  it("list/create/patch/delete filter by session user id and never trust a client user_id", () => {
    const server = readFileSync(join(root, "lib/alerts/server.ts"), "utf8");
    const collection = readFileSync(join(root, "app/api/alerts/route.ts"), "utf8");
    const item = readFileSync(join(root, "app/api/alerts/[id]/route.ts"), "utf8");
    assert.match(server, /getSessionUser/);
    assert.match(server, /\.eq\("user_id", user\.id\)/);
    assert.match(server, /ALERT_MAX_PER_USER/);
    assert.match(server, /assertAlertFrequencyAllowed/);
    assert.match(server, /frequency !== "daily"/);
    assert.doesNotMatch(collection, /body\.user_id|userId/);
    assert.doesNotMatch(item, /body\.user_id|userId/);
    // Cross-user patch/read must always re-check owner on the id lookup.
    const eqCount = (server.match(/\.eq\("user_id", user\.id\)/g) ?? []).length;
    assert.ok(eqCount >= 5, `expected owner filters on every mutation, found ${eqCount}`);
  });

  it("normalizeAlertQuery uses the same parseJobSearchQuery as /jobs", () => {
    const query = normalizeAlertQuery("q=react&src=greenhouse&locMode=remote&bogus=1&match=75");
    assert.match(query, /q=react/);
    assert.match(query, /src=greenhouse/);
    assert.match(query, /locMode=remote/);
    assert.match(query, /match=75/);
    assert.doesNotMatch(query, /bogus=/);
  });
});

describe("localStorage saved searches stay untouched", () => {
  it("does not rewrite lib/saved-searches behaviour", () => {
    const source = readFileSync(join(root, "lib/saved-searches.ts"), "utf8");
    assert.match(source, /wg-saved-searches/);
    assert.match(source, /slice\(0, 20\)/);
    assert.doesNotMatch(source, /job_alerts|\/api\/alerts/);
  });
});
