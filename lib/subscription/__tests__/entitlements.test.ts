import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { logErrorCode } from "../../security/log.ts";
import { LIMITS, resolveSubscriptionStatus } from "../index.ts";
import { canUse, utcMonthWindow } from "../entitlements.ts";
import { PAID_FEATURES } from "../features.ts";
import { countUsageSince, recordUsage, UsageError } from "../usage.ts";

const USER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const NOW = new Date("2026-10-24T18:00:00.000Z");
const RESETS = "2026-11-01T00:00:00.000Z";
const SECRET = "person@example.com resume body token sk-live";

function freeStatus() {
  return { tier: "free" as const, isActive: false };
}

function captureLogs(run: () => Promise<void>): Promise<string[]> {
  const lines: string[] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => {
    lines.push(args.map((part) => String(part)).join(" "));
  };
  return run()
    .then(() => lines)
    .finally(() => {
      console.error = original;
    });
}

describe("subscription status", () => {
  it("keeps the existing free cover-letter and interview caps and adds tailoring", () => {
    assert.equal(LIMITS.free.coverLettersPerMonth, 3);
    assert.equal(LIMITS.free.interviewQuestionsPerWeek, 5);
    assert.equal(LIMITS.free.tailoringPerMonth, 2);
    assert.equal(LIMITS.premium.coverLettersPerMonth, -1);
    assert.equal(LIMITS.premium.tailoringPerMonth, -1);
    assert.equal(LIMITS.pro.interviewQuestionsPerWeek, -1);
  });

  it("treats an unexpired paid tier as active and an expired paid tier as inactive", () => {
    const future = new Date("2026-12-01T00:00:00.000Z");
    const past = new Date("2026-01-01T00:00:00.000Z");
    const active = resolveSubscriptionStatus(
      { subscription_tier: "premium", subscription_expires_at: future.toISOString() },
      false,
      NOW,
    );
    assert.equal(active.tier, "premium");
    assert.equal(active.isActive, true);

    const expired = resolveSubscriptionStatus(
      { subscription_tier: "pro", subscription_expires_at: past.toISOString() },
      false,
      NOW,
    );
    assert.equal(expired.tier, "pro");
    assert.equal(expired.isActive, false);
    assert.equal(expired.readFailed, undefined);
  });

  it("marks a database failure without treating a missing profile as a failure", () => {
    const missing = resolveSubscriptionStatus(null, false, NOW);
    assert.equal(missing.tier, "free");
    assert.equal(missing.readFailed, undefined);

    const failed = resolveSubscriptionStatus(null, true, NOW);
    assert.equal(failed.readFailed, true);
    assert.equal(failed.isActive, false);
  });
});

describe("canUse", () => {
  it("allows a free user under the cover-letter cap and counts only this UTC month", async () => {
    let sinceSeen: Date | null = null;
    const decision = await canUse(USER, "cover_letter", {
      now: NOW,
      readSubscription: async () => freeStatus(),
      countUsage: async (_userId, feature, since) => {
        assert.equal(feature, "cover_letter");
        sinceSeen = since;
        return 2;
      },
    });

    assert.equal(decision.allowed, true);
    assert.equal(decision.used, 2);
    assert.equal(decision.limit, 3);
    assert.equal(decision.tier, "free");
    assert.equal(decision.reason, "ok");
    assert.equal(decision.resetsAt, RESETS);
    assert.equal(sinceSeen?.toISOString(), utcMonthWindow(NOW).since.toISOString());
  });

  it("denies a free user who has reached the cover-letter cap", async () => {
    const decision = await canUse(USER, "cover_letter", {
      now: NOW,
      readSubscription: async () => freeStatus(),
      countUsage: async () => 3,
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.used, 3);
    assert.equal(decision.limit, LIMITS.free.coverLettersPerMonth);
    assert.equal(decision.reason, "limit_reached");
    assert.equal(decision.resetsAt, RESETS);
  });

  it("allows an unexpired paid plan without reading usage", async () => {
    let counted = false;
    const decision = await canUse(USER, "cover_letter", {
      now: NOW,
      readSubscription: async () => ({
        tier: "premium",
        isActive: true,
        expiresAt: new Date("2026-12-01T00:00:00.000Z"),
      }),
      countUsage: async () => {
        counted = true;
        return 99;
      },
    });
    assert.equal(decision.allowed, true);
    assert.equal(decision.limit, -1);
    assert.equal(decision.tier, "premium");
    assert.equal(decision.resetsAt, null);
    assert.equal(counted, false);
  });

  it("treats an expired paid plan as free", async () => {
    const decision = await canUse(USER, "cover_letter", {
      now: NOW,
      readSubscription: async () =>
        resolveSubscriptionStatus(
          { subscription_tier: "premium", subscription_expires_at: "2026-01-01T00:00:00.000Z" },
          false,
          NOW,
        ),
      countUsage: async () => 3,
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.tier, "free");
    assert.equal(decision.limit, 3);
    assert.equal(decision.reason, "limit_reached");
  });

  it("allows an expired paid plan while it is still under the free cap", async () => {
    const decision = await canUse(USER, "tailoring", {
      now: NOW,
      readSubscription: async () =>
        resolveSubscriptionStatus(
          { subscription_tier: "pro", subscription_expires_at: "2025-01-01T00:00:00.000Z" },
          false,
          NOW,
        ),
      countUsage: async () => 1,
    });
    assert.equal(decision.allowed, true);
    assert.equal(decision.limit, 2);
    assert.equal(decision.tier, "free");
  });

  it("denies free tailoring at 2 uses", async () => {
    const decision = await canUse(USER, "tailoring", {
      now: NOW,
      readSubscription: async () => freeStatus(),
      countUsage: async () => 2,
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.limit, 2);
    assert.equal(decision.reason, "limit_reached");
  });

  it("fails closed for a paid feature with no free quota", async () => {
    let counted = false;
    const decision = await canUse(USER, "talent_intelligence", {
      now: NOW,
      readSubscription: async () => freeStatus(),
      countUsage: async () => {
        counted = true;
        return 0;
      },
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.limit, 0);
    assert.equal(counted, false);
  });

  it("denies the paid feature when the subscription read fails and logs only an error code", async () => {
    const lines = await captureLogs(async () => {
      const decision = await canUse(USER, "cover_letter", {
        now: NOW,
        readSubscription: async () => {
          throw new Error(`db down for ${SECRET}`);
        },
        countUsage: async () => 0,
      });
      assert.equal(decision.allowed, false);
      assert.equal(decision.reason, "unavailable");
    });
    assert.equal(lines.some((line) => line.includes("entitlement_unavailable")), true);
    assert.equal(lines.some((line) => line.includes(SECRET) || line.includes(USER)), false);
  });

  it("denies the paid feature when the usage count fails and does not log the database message", async () => {
    const lines = await captureLogs(async () => {
      const decision = await canUse(USER, "cover_letter", {
        now: NOW,
        readSubscription: async () => freeStatus(),
        countUsage: async () => {
          throw new Error(SECRET);
        },
      });
      assert.equal(decision.allowed, false);
      assert.equal(decision.reason, "unavailable");
    });
    assert.equal(lines.some((line) => line.includes("usage_count_failed")), true);
    assert.equal(lines.some((line) => line.includes("person@example.com")), false);
    assert.equal(lines.some((line) => line.includes("resume")), false);
    assert.equal(lines.some((line) => line.includes(USER)), false);
  });

  it("does not include job search, matching, tracker, or hidden jobs", () => {
    const names = PAID_FEATURES.join(" ");
    assert.equal(names.includes("job"), false);
    assert.equal(names.includes("match"), false);
    assert.equal(names.includes("tracker"), false);
    assert.equal(names.includes("hidden"), false);

    const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
    const untouched = [
      "app/api/jobs/route.ts",
      "app/api/v2/match-jobs/route.ts",
      "app/api/applications/route.ts",
      "app/api/hidden-jobs/route.ts",
      "lib/job-match.ts",
    ];
    for (const rel of untouched) {
      const source = readFileSync(join(root, rel), "utf8");
      assert.equal(source.includes("canUse"), false, rel);
      assert.equal(source.includes("feature_usage"), false, rel);
    }
  });
});

describe("usage ledger", () => {
  it("counts and records only the session user id", async () => {
    let counted: { userId: string; feature: string; since: string } | null = null;
    const since = utcMonthWindow(NOW).since;
    const total = await countUsageSince(USER, "cover_letter", since, {
      query: async (userId, feature, sinceIso) => {
        counted = { userId, feature, since: sinceIso };
        return 1;
      },
    });
    assert.equal(total, 1);
    assert.deepEqual(counted, {
      userId: USER,
      feature: "cover_letter",
      since: since.toISOString(),
    });

    let inserted: { userId: string; feature: string } | null = null;
    await recordUsage(USER, "cover_letter", {
      insert: async (userId, feature) => {
        inserted = { userId, feature };
      },
    });
    assert.deepEqual(inserted, { userId: USER, feature: "cover_letter" });
    assert.notEqual(inserted?.userId, OTHER);
  });

  it("rejects a non-uuid id before it touches storage", async () => {
    let called = false;
    await assert.rejects(
      () => recordUsage("not-a-user", "cover_letter", { insert: async () => { called = true; } }),
      (error: unknown) => error instanceof UsageError && error.code === "usage_invalid",
    );
    assert.equal(called, false);
  });

  it("hides database error text behind a stable code", async () => {
    await assert.rejects(
      () =>
        countUsageSince(USER, "cover_letter", NOW, {
          query: async () => {
            throw new Error(`duplicate key ${SECRET}`);
          },
        }),
      (error: unknown) =>
        error instanceof UsageError &&
        error.code === "usage_count_failed" &&
        !error.message.includes("@") &&
        !error.message.includes("resume"),
    );
  });
});

describe("logErrorCode", () => {
  it("drops a message that is not an allow-listed code", async () => {
    const lines = await captureLogs(async () => {
      logErrorCode("subscription/entitlement", SECRET);
    });
    assert.deepEqual(lines, ["[subscription/entitlement] unknown_error"]);
  });
});
