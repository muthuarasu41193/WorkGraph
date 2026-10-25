import { getSessionUser } from "@/lib/auth/session-server";

import { razorpayKeyId, razorpayKeySecret, razorpayWebhookSecret } from "./env";
import { grantPass, type GrantDeps } from "./grant";
import type { CreateOrderDeps, VerifyDeps, WebhookDeps } from "./handlers";
import { createRazorpayOrder } from "./razorpay-api";
import {
  claimCreatedPayment,
  findPaymentByOrderId,
  findPaymentByPaymentId,
  insertCreatedPayment,
  readSubscriptionExpiry,
  writePremiumUntil,
} from "./store";

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
  };
}

export function productionVerifyDeps(): VerifyDeps {
  return {
    getSessionUser: sessionId,
    keySecret: razorpayKeySecret,
    grant: (input) => grantPass(input, grantStore()),
  };
}

export function productionWebhookDeps(): WebhookDeps {
  return {
    webhookSecret: razorpayWebhookSecret,
    grant: (input) => grantPass(input, grantStore()),
  };
}
