import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { hasVaultEntitlement, isVaultListingFree } from "../../security/vault-entitlement";
import { BillingError } from "../errors";
import { grantVault, type VaultGrantDeps } from "../grant-vault";
import { handleCreateOrder, handleVerifyPayment } from "../handlers";
import type { PaymentRecord } from "../grant";
import { inrToPaise, parseVaultExperienceId, vaultPlanId } from "../vault-plan";
import { resolveVaultOrderAmount } from "../vault-order";
import { hmacSha256Hex } from "../signature";

const BUYER = "11111111-1111-4111-8111-111111111111";
const SELLER = "22222222-2222-4222-8222-222222222222";
const EXPERIENCE = "33333333-3333-4333-8333-333333333333";
const KEY_SECRET = "test_key_secret";

function orderRequest(body: unknown): Request {
  return new Request("http://localhost/api/billing/razorpay/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function verifyRequest(body: unknown): Request {
  return new Request("http://localhost/api/billing/razorpay/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("vault plan helpers", () => {
  it("round-trips experience ids and converts INR to paise", () => {
    assert.equal(vaultPlanId(EXPERIENCE), `vault:${EXPERIENCE}`);
    assert.equal(parseVaultExperienceId(vaultPlanId(EXPERIENCE)), EXPERIENCE);
    assert.equal(parseVaultExperienceId("pass_30"), null);
    assert.equal(inrToPaise(499), 49900);
    assert.equal(inrToPaise(0), 0);
  });
});

describe("resolveVaultOrderAmount", () => {
  const listing = {
    id: EXPERIENCE,
    sellerId: SELLER,
    status: "published",
    priceInr: 499,
  };

  it("blocks the seller from buying their own listing", () => {
    assert.throws(
      () =>
        resolveVaultOrderAmount({
          buyerId: SELLER,
          listing,
          purchase: null,
        }),
      (error: unknown) => error instanceof BillingError && error.code === "vault_own_listing",
    );
  });

  it("ignores any notion of a client amount and uses listing price_inr", () => {
    const resolved = resolveVaultOrderAmount({
      buyerId: BUYER,
      listing: { ...listing, priceInr: 799 },
      purchase: null,
    });
    assert.equal(resolved.amountPaise, 79900);
    assert.equal(resolved.planId, vaultPlanId(EXPERIENCE));
  });

  it("blocks a second charge when already verified", () => {
    assert.throws(
      () =>
        resolveVaultOrderAmount({
          buyerId: BUYER,
          listing,
          purchase: { id: "purchase-1", paymentStatus: "verified" },
        }),
      (error: unknown) => error instanceof BillingError && error.code === "vault_already_purchased",
    );
  });

  it("rejects free listings for checkout", () => {
    assert.throws(
      () =>
        resolveVaultOrderAmount({
          buyerId: BUYER,
          listing: { ...listing, priceInr: 0 },
          purchase: null,
        }),
      (error: unknown) => error instanceof BillingError && error.code === "vault_free",
    );
  });
});

describe("vault entitlement stays verified-only", () => {
  it("pending never unlocks; free unlocks without payment; verified unlocks", () => {
    assert.equal(isVaultListingFree(0), true);
    assert.equal(
      hasVaultEntitlement({
        viewerId: BUYER,
        sellerId: SELLER,
        priceInr: 499,
        purchase: { payment_status: "pending" },
      }),
      false,
    );
    assert.equal(
      hasVaultEntitlement({
        viewerId: BUYER,
        sellerId: SELLER,
        priceInr: 0,
        purchase: null,
      }),
      true,
    );
    assert.equal(
      hasVaultEntitlement({
        viewerId: BUYER,
        sellerId: SELLER,
        priceInr: 499,
        purchase: { payment_status: "verified" },
      }),
      true,
    );
  });
});

describe("vault order route", () => {
  it("returns 401 when unauthenticated", async () => {
    let called = false;
    const response = await handleCreateOrder(
      orderRequest({ kind: "vault", experienceId: EXPERIENCE, amount: 1 }),
      {
        getSessionUser: async () => null,
        keyId: () => "rzp_test_public",
        createOrder: async () => {
          called = true;
          return { id: "order_x", amount: 1, currency: "INR" };
        },
        insertPayment: async () => {
          called = true;
        },
        loadVaultListing: async () => {
          called = true;
          return null;
        },
        loadVaultPurchase: async () => null,
        ensurePendingVaultPurchase: async () => "p1",
        attachVaultOrderReference: async () => undefined,
      },
    );
    assert.equal(response.status, 401);
    assert.equal(called, false);
  });

  it("charges listing price_inr and ignores a client-sent amount", async () => {
    let seenAmount = 0;
    let notes: Record<string, string> = {};
    let attachedOrderId = "";
    const response = await handleCreateOrder(
      orderRequest({ kind: "vault", experienceId: EXPERIENCE, amount: 100, currency: "USD" }),
      {
        getSessionUser: async () => ({ id: BUYER }),
        keyId: () => "rzp_test_public",
        newId: () => "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        createOrder: async (input) => {
          seenAmount = input.amountPaise;
          notes = input.notes;
          return { id: "order_vault", amount: input.amountPaise, currency: input.currency };
        },
        insertPayment: async (row) => {
          assert.equal(row.amountPaise, 49900);
          assert.equal(row.planId, vaultPlanId(EXPERIENCE));
          assert.equal(row.userId, BUYER);
        },
        loadVaultListing: async () => ({
          id: EXPERIENCE,
          sellerId: SELLER,
          status: "published",
          priceInr: 499,
        }),
        loadVaultPurchase: async () => null,
        ensurePendingVaultPurchase: async (input) => {
          assert.equal(input.buyerId, BUYER);
          assert.equal(input.amountInr, 499);
          return "purchase-1";
        },
        attachVaultOrderReference: async (input) => {
          attachedOrderId = input.providerOrderId;
        },
      },
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      kind: string;
      amount: number;
      orderId: string;
      experienceId: string;
    };
    assert.equal(seenAmount, 49900);
    assert.equal(body.kind, "vault");
    assert.equal(body.amount, 49900);
    assert.equal(body.orderId, "order_vault");
    assert.equal(body.experienceId, EXPERIENCE);
    assert.equal(attachedOrderId, "order_vault");
    assert.deepEqual(notes, { user_id: BUYER, plan_id: vaultPlanId(EXPERIENCE) });
  });

  it("rejects seller self-purchase before creating a Razorpay order", async () => {
    let called = false;
    const response = await handleCreateOrder(
      orderRequest({ kind: "vault", experienceId: EXPERIENCE }),
      {
        getSessionUser: async () => ({ id: SELLER }),
        keyId: () => "rzp_test_public",
        createOrder: async () => {
          called = true;
          return { id: "order_x", amount: 49900, currency: "INR" };
        },
        insertPayment: async () => {
          called = true;
        },
        loadVaultListing: async () => ({
          id: EXPERIENCE,
          sellerId: SELLER,
          status: "published",
          priceInr: 499,
        }),
        loadVaultPurchase: async () => null,
        ensurePendingVaultPurchase: async () => "p1",
        attachVaultOrderReference: async () => undefined,
      },
    );
    assert.equal(response.status, 400);
    assert.equal(called, false);
  });
});

describe("grantVault idempotency", () => {
  function memoryVault(priceInr = 499) {
    const payments: PaymentRecord[] = [];
    let verifiedCount = 0;
    const deps: VaultGrantDeps = {
      findByOrderId: async (orderId) => payments.find((row) => row.providerOrderId === orderId) ?? null,
      findByPaymentId: async (paymentId) =>
        payments.find((row) => row.providerPaymentId === paymentId) ?? null,
      claimCreated: async (paymentRowId, providerPaymentId, grantedUntil) => {
        const row = payments.find((item) => item.id === paymentRowId);
        if (!row || row.status !== "created") return null;
        if (payments.some((item) => item.providerPaymentId === providerPaymentId)) return null;
        row.status = "paid";
        row.providerPaymentId = providerPaymentId;
        row.grantedUntil = grantedUntil;
        return { ...row };
      },
      readListingPriceInr: async () => priceInr,
      markPurchaseVerified: async () => {
        verifiedCount += 1;
        return { applied: verifiedCount === 1 };
      },
    };
    return {
      deps,
      payments,
      verifiedCount: () => verifiedCount,
      seed(row: PaymentRecord) {
        payments.push(row);
      },
    };
  }

  it("double verify does not double-apply the vault unlock", async () => {
    const store = memoryVault();
    store.seed({
      id: "payrow-vault",
      userId: BUYER,
      planId: vaultPlanId(EXPERIENCE),
      amountPaise: 49900,
      currency: "INR",
      providerOrderId: "order_vault",
      providerPaymentId: null,
      status: "created",
      grantedUntil: null,
    });
    const input = {
      providerOrderId: "order_vault",
      providerPaymentId: "pay_vault",
      expectedUserId: BUYER,
    };
    const first = await grantVault(input, store.deps);
    const second = await grantVault(input, store.deps);
    assert.equal(first.applied, true);
    assert.equal(second.applied, false);
    assert.equal(first.unlocked, true);
    assert.equal(second.unlocked, true);
    assert.equal(store.payments[0]?.status, "paid");
    assert.equal(store.verifiedCount(), 2);
  });

  it("verify returns vault unlocked payload", async () => {
    const store = memoryVault();
    store.seed({
      id: "payrow-vault",
      userId: BUYER,
      planId: vaultPlanId(EXPERIENCE),
      amountPaise: 49900,
      currency: "INR",
      providerOrderId: "order_vault",
      providerPaymentId: null,
      status: "created",
      grantedUntil: null,
    });
    const signature = hmacSha256Hex(KEY_SECRET, "order_vault|pay_vault");
    const response = await handleVerifyPayment(
      verifyRequest({
        razorpay_order_id: "order_vault",
        razorpay_payment_id: "pay_vault",
        razorpay_signature: signature,
      }),
      {
        getSessionUser: async () => ({ id: BUYER }),
        keySecret: () => KEY_SECRET,
        grant: (input) => grantVault(input, store.deps),
      },
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as { ok: boolean; kind: string; unlocked: boolean };
    assert.equal(body.ok, true);
    assert.equal(body.kind, "vault");
    assert.equal(body.unlocked, true);
  });
});
