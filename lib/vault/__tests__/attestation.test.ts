import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  requireAttestationForPublish,
  VAULT_ATTESTATION_COPY,
  VAULT_ATTESTATION_VERSION,
  VAULT_CONTRIBUTOR_GUIDANCE,
} from "../attestation.ts";

describe("vault contributor attestation", () => {
  it("requires acceptance of the current attestation version to publish", () => {
    assert.equal(requireAttestationForPublish({ attestationAccepted: false }).ok, false);
    assert.equal(
      requireAttestationForPublish({
        attestationAccepted: true,
        attestationVersion: "old-version",
      }).ok,
      false,
    );
    const ok = requireAttestationForPublish({
      attestationAccepted: true,
      attestationVersion: VAULT_ATTESTATION_VERSION,
    });
    assert.equal(ok.ok, true);
    if (ok.ok) assert.equal(ok.version, VAULT_ATTESTATION_VERSION);
  });

  it("marks legal copy as needing counsel review", () => {
    assert.ok(VAULT_ATTESTATION_COPY.length >= 3);
    for (const line of VAULT_ATTESTATION_COPY) {
      assert.match(line, /NEEDS COUNSEL REVIEW/);
    }
    assert.ok(VAULT_CONTRIBUTOR_GUIDANCE.length >= 3);
    const blob = [...VAULT_ATTESTATION_COPY, ...VAULT_CONTRIBUTOR_GUIDANCE].join(" ").toLowerCase();
    assert.equal(blob.includes("verified"), false);
  });
});
