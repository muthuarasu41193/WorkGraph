import { getSessionUser } from "@/lib/auth/session-server";

import { BillingError } from "./errors";
import { razorpayKeyId, razorpayKeySecret, razorpayWebhookSecret } from "./env";
import { grantPass, type GrantDeps } from "./grant";
import { grantVault, type VaultGrantDeps } from "./grant-vault";
import type { CreateOrderDeps, GrantPaymentResult, VerifyDeps, WebhookDeps } from "./handlers";
import { createRazorpayOrder } from "./razorpay-api";
import {
  claimCreatedPayment,
  findPaymentByOrderId,
  findPaymentByPaymentId,
  insertCreatedPayment,
  readSubscriptionExpiry,
  writePremiumUntil,
} from "./store";
import { isVaultPlanId } from "./vault-plan";
import {
  attachVaultOrderReference,
  ensurePendingVaultPurchase,
  loadVaultListingForOrder,
  loadVaultPurchaseForOrder,
  markVaultPurchaseVerified,
  readVaultListingPriceInr,
} from "./vault-store";

function sessionId(request: Request): Promise<{ id: string } | null> {
  return getSessionUser(request).then((user) => (user ? { id: user.id } : null));
}

function grantStore(): GrantDeps {
  return {
    findByOrderId: findPaymentByOrderId,
    findByPaymentId: findPaymentByPaymentId,
    claimCreated: claimCreatedPayment,
    readExpiry: readSubscriptionExpiry,
    writePremium: writePremiumUntil,
  };
}

function vaultGrantStore(): VaultGrantDeps {
  return {
    findByOrderId: findPaymentByOrderId,
    findByPaymentId: findPaymentByPaymentId,
    claimCreated: claimCreatedPayment,
    readListingPriceInr: readVaultListingPriceInr,
    markPurchaseVerified: markVaultPurchaseVerified,
  };
}

async function grantPayment(input: {
  providerOrderId: string;
  providerPaymentId: string;
  expectedUserId?: string;
}): Promise<GrantPaymentResult> {
  const payment = await findPaymentByOrderId(input.providerOrderId);
  if (!payment) {
    throw new BillingError("Payment not found.", 404, "payment_not_found");
  }
  if (isVaultPlanId(payment.planId)) {
    return grantVault(input, vaultGrantStore());
  }
  const result = await grantPass(input, grantStore());
  return { ...result, kind: "pass" };
}

export function productionOrderDeps(): CreateOrderDeps {
  return {
    getSessionUser: sessionId,
    keyId: razorpayKeyId,
    createOrder: (input) =>
      createRazorpayOrder({
        ...input,
        keyId: razorpayKeyId(),
        keySecret: razorpayKeySecret(),
      }),
    insertPayment: insertCreatedPayment,
    loadVaultListing: loadVaultListingForOrder,
    loadVaultPurchase: loadVaultPurchaseForOrder,
    ensurePendingVaultPurchase,
    attachVaultOrderReference,
  };
}

export function productionVerifyDeps(): VerifyDeps {
  return {
    getSessionUser: sessionId,
    keySecret: razorpayKeySecret,
    grant: grantPayment,
  };
}

export function productionWebhookDeps(): WebhookDeps {
  return {
    webhookSecret: razorpayWebhookSecret,
    grant: grantPayment,
  };
}
