import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { companyAvatarToneIndex, companyInitials } from "../company-avatar";

describe("companyInitials", () => {
  it("uses first and last letter for a single significant word", () => {
    assert.equal(companyInitials("Acme"), "AE");
    assert.equal(companyInitials("Stripe"), "SE");
  });

  it("keeps different multi-word companies from collapsing to the same letters", () => {
    assert.equal(companyInitials("Cool Apps"), "CS");
    assert.equal(companyInitials("Company Alpha"), "CA");
    assert.equal(companyInitials("Bank of America"), "BA");
    assert.equal(companyInitials("Cloudflare, Inc."), "CE");
    assert.equal(companyInitials("Thoughtworks India Pvt Ltd"), "TS");
  });

  it("returns a stable fallback for empty names", () => {
    assert.equal(companyInitials(""), "?");
    assert.equal(companyInitials("   "), "?");
  });
});

describe("companyAvatarToneIndex", () => {
  it("returns different buckets for different company names", () => {
    const a = companyAvatarToneIndex("Acme");
    const b = companyAvatarToneIndex("Stripe");
    assert.notEqual(a, b);
  });

  it("is stable for the same name", () => {
    assert.equal(companyAvatarToneIndex("Acme"), companyAvatarToneIndex("Acme"));
  });
});
