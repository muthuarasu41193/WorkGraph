import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  daysSinceIso,
  isVaultGuideStale,
  VAULT_STALE_AFTER_DAYS,
  vaultFreshnessDisplay,
} from "../freshness.ts";

describe("vault freshness", () => {
  const now = Date.parse("2026-11-13T00:00:00.000Z");

  it("exposes a configurable stale threshold constant", () => {
    assert.equal(typeof VAULT_STALE_AFTER_DAYS, "number");
    assert.ok(VAULT_STALE_AFTER_DAYS > 0);
  });

  it("computes days since an ISO timestamp", () => {
    assert.equal(daysSinceIso("2026-11-03T00:00:00.000Z", now), 10);
    assert.equal(daysSinceIso(null, now), null);
    assert.equal(daysSinceIso("not-a-date", now), null);
  });

  it("marks guides stale when confirmation is older than the threshold", () => {
    const fresh = new Date(now - (VAULT_STALE_AFTER_DAYS - 1) * 86_400_000).toISOString();
    const stale = new Date(now - (VAULT_STALE_AFTER_DAYS + 1) * 86_400_000).toISOString();
    assert.equal(isVaultGuideStale(fresh, { now }), false);
    assert.equal(isVaultGuideStale(stale, { now }), true);
    assert.equal(isVaultGuideStale(null, { now }), true);
  });

  it("builds display labels without using the word verified", () => {
    const display = vaultFreshnessDisplay({
      updatedAt: "2026-10-01T00:00:00.000Z",
      contentConfirmedAt: "2026-01-01T00:00:00.000Z",
      now,
    });
    assert.match(display.lastUpdatedLabel ?? "", /Last updated/i);
    assert.match(display.lastConfirmedLabel ?? "", /Last confirmed/i);
    assert.equal(display.stale, true);
    assert.equal(display.staleLabel, "May be outdated");
    const blob = JSON.stringify(display).toLowerCase();
    assert.equal(blob.includes("verified"), false);
  });
});
