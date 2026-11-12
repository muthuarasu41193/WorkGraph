import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  defaultVaultTrustStatuses,
  normalizeVaultTrustStatuses,
  VAULT_TRUST_LABELS,
} from "../index.ts";

describe("vault trust labels", () => {
  it("defaults to not independently verified", () => {
    assert.deepEqual(defaultVaultTrustStatuses(false), ["not_independently_verified"]);
  });

  it("includes outcome self-reported when an outcome exists", () => {
    assert.deepEqual(defaultVaultTrustStatuses(true), [
      "outcome_self_reported",
      "not_independently_verified",
    ]);
  });

  it("never invents a vague verified badge label", () => {
    for (const label of Object.values(VAULT_TRUST_LABELS)) {
      assert.equal(/^\s*verified\s*$/i.test(label), false);
    }
  });

  it("normalizes empty arrays to defaults", () => {
    assert.deepEqual(normalizeVaultTrustStatuses([], true), defaultVaultTrustStatuses(true));
  });
});
