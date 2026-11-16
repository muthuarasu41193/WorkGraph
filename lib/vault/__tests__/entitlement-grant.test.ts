import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  decideVaultEntitlementGrant,
  isIdempotentVerifiedReplay,
} from "../entitlement-grant.ts";

const BUYER = "11111111-1111-4111-8111-111111111111";
const SELLER = "22222222-2222-4222-8222-222222222222";

describe("decideVaultEntitlementGrant", () => {
  it("grants free listings and owners without payment", () => {
    const free = decideVaultEntitlementGrant({
      viewerId: BUYER,
      sellerId: SELLER,
      listingPriceInr: 0,
      purchase: null,
    });
    assert.equal(free.grant, true);
    if (free.grant) assert.equal(free.reason, "free_listing");

    const owner = decideVaultEntitlementGrant({
      viewerId: SELLER,
      sellerId: SELLER,
      listingPriceInr: 499,
      purchase: null,
    });
    assert.equal(owner.grant, true);
    if (owner.grant) assert.equal(owner.reason, "owner");
  });

  it("does not grant on pending purchase (replay)", () => {
    const decision = decideVaultEntitlementGrant({
      viewerId: BUYER,
      sellerId: SELLER,
      listingPriceInr: 499,
      purchase: { payment_status: "pending" },
    });
    assert.equal(decision.grant, false);
    if (!decision.grant) {
      assert.equal(decision.reason, "replay_pending");
      assert.equal(decision.entitlement, "pending");
    }
  });

  it("rejects forged verified confirmations without provider signature", () => {
    const decision = decideVaultEntitlementGrant({
      viewerId: BUYER,
      sellerId: SELLER,
      listingPriceInr: 499,
      purchase: { payment_status: "pending" },
      confirmation: {
        payment_status: "verified",
        claimedAmountInr: 499,
        providerSignatureValid: false,
        providerPaymentId: "pay_forged",
      },
    });
    assert.equal(decision.grant, false);
    if (!decision.grant) assert.equal(decision.reason, "forged_confirmation");
  });

  it("rejects forged confirmations that omit payment id", () => {
    const decision = decideVaultEntitlementGrant({
      viewerId: BUYER,
      sellerId: SELLER,
      listingPriceInr: 499,
      purchase: null,
      confirmation: {
        payment_status: "verified",
        providerSignatureValid: true,
        providerPaymentId: "",
      },
    });
    assert.equal(decision.grant, false);
    if (!decision.grant) assert.equal(decision.reason, "forged_confirmation");
  });

  it("rejects client-supplied price mismatches", () => {
    const decision = decideVaultEntitlementGrant({
      viewerId: BUYER,
      sellerId: SELLER,
      listingPriceInr: 499,
      purchase: null,
      confirmation: {
        payment_status: "verified",
        claimedAmountInr: 1,
        providerSignatureValid: true,
        providerPaymentId: "pay_real",
      },
    });
    assert.equal(decision.grant, false);
    if (!decision.grant) assert.equal(decision.reason, "price_mismatch");
  });

  it("grants only after a server-verified confirmation with matching listing price", () => {
    const decision = decideVaultEntitlementGrant({
      viewerId: BUYER,
      sellerId: SELLER,
      listingPriceInr: 499,
      purchase: { payment_status: "pending" },
      confirmation: {
        payment_status: "verified",
        claimedAmountInr: 499,
        providerSignatureValid: true,
        providerPaymentId: "pay_abc",
      },
    });
    assert.equal(decision.grant, true);
    if (decision.grant) {
      assert.equal(decision.amountInr, 499);
      assert.equal(decision.reason, "verified_payment");
    }
  });

  it("treats an already-verified purchase as an idempotent success", () => {
    const purchase = { payment_status: "verified" as const };
    assert.equal(isIdempotentVerifiedReplay(purchase), true);
    const decision = decideVaultEntitlementGrant({
      viewerId: BUYER,
      sellerId: SELLER,
      listingPriceInr: 499,
      purchase,
      confirmation: {
        payment_status: "verified",
        claimedAmountInr: 9999,
        providerSignatureValid: false,
      },
    });
    assert.equal(decision.grant, true);
    if (decision.grant) assert.equal(decision.reason, "verified_payment");
  });

  it("uses the server listing price as the grant amount, never a client amount", () => {
    const decision = decideVaultEntitlementGrant({
      viewerId: BUYER,
      sellerId: SELLER,
      listingPriceInr: 799,
      purchase: null,
      confirmation: {
        payment_status: "verified",
        claimedAmountInr: 799,
        providerSignatureValid: true,
        providerPaymentId: "pay_x",
      },
    });
    assert.equal(decision.grant, true);
    if (decision.grant) assert.equal(decision.amountInr, 799);
  });
});
