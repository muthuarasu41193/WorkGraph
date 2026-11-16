import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  VAULT_PLATFORM_FEE_RATE_DEFAULT,
  computeContributorEarnings,
  getVaultPlatformFeeRate,
} from "../earnings.ts";

describe("getVaultPlatformFeeRate", () => {
  it("defaults to the 25% planning assumption", () => {
    assert.equal(getVaultPlatformFeeRate(""), VAULT_PLATFORM_FEE_RATE_DEFAULT);
    assert.equal(getVaultPlatformFeeRate(null), VAULT_PLATFORM_FEE_RATE_DEFAULT);
    assert.equal(VAULT_PLATFORM_FEE_RATE_DEFAULT, 0.25);
  });

  it("accepts a valid override and rejects out-of-range values", () => {
    assert.equal(getVaultPlatformFeeRate("0.2"), 0.2);
    assert.equal(getVaultPlatformFeeRate("1"), 1);
    assert.equal(getVaultPlatformFeeRate("0"), 0);
    assert.equal(getVaultPlatformFeeRate("-1"), VAULT_PLATFORM_FEE_RATE_DEFAULT);
    assert.equal(getVaultPlatformFeeRate("2"), VAULT_PLATFORM_FEE_RATE_DEFAULT);
    assert.equal(getVaultPlatformFeeRate("abc"), VAULT_PLATFORM_FEE_RATE_DEFAULT);
  });
});

describe("computeContributorEarnings", () => {
  it("computes fee and net server-side from gross INR only", () => {
    const result = computeContributorEarnings(1000, 0.25);
    assert.equal(result.grossInr, 1000);
    assert.equal(result.feeInr, 250);
    assert.equal(result.netInr, 750);
    assert.equal(result.feeRatePercentLabel, "25%");
    assert.match(result.feePolicyNote, /planning assumption/i);
    assert.equal(result.grossUsd, 12);
    assert.equal(result.feeUsd, 3);
    assert.equal(result.netUsd, 9);
  });

  it("never trusts negative or non-finite gross amounts", () => {
    assert.equal(computeContributorEarnings(-50, 0.25).grossInr, 0);
    assert.equal(computeContributorEarnings(Number.NaN, 0.25).netInr, 0);
  });

  it("falls back to the default fee when rate is invalid", () => {
    const result = computeContributorEarnings(400, Number.NaN);
    assert.equal(result.feeRate, VAULT_PLATFORM_FEE_RATE_DEFAULT);
    assert.equal(result.feeInr, 100);
    assert.equal(result.netInr, 300);
  });
});
