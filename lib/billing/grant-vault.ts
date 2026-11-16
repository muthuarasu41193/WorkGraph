import { BillingError } from "./errors";
import type { PaymentRecord } from "./grant";
import { parseVaultExperienceId } from "./vault-plan";

export type VaultGrantDeps = {
  findByOrderId: (orderId: string) => Promise<PaymentRecord | null>;
  findByPaymentId: (paymentId: string) => Promise<PaymentRecord | null>;
  claimCreated: (
    paymentRowId: string,
    providerPaymentId: string,
    grantedUntil: string | null,
  ) => Promise<PaymentRecord | null>;
  /** Load listing price to re-check amount at grant time. */
  readListingPriceInr: (experienceId: string) => Promise<number | null>;
  /**
   * Set vault_purchases to verified for this buyer + experience.
   * Idempotent: already-verified rows stay verified. Returns whether a row was updated.
   */
  markPurchaseVerified: (input: {
    buyerId: string;
    experienceId: string;
    providerPaymentId: string;
  }) => Promise<{ applied: boolean }>;
};

export type VaultGrantResult = {
  kind: "vault";
  unlocked: true;
  applied: boolean;
  experienceId: string;
};

/**
 * Apply one Razorpay payment id once to a vault unlock.
 * A second call with the same payment id does not re-insert a purchase row.
 */
export async function grantVault(
  input: {
    providerOrderId: string;
    providerPaymentId: string;
    expectedUserId?: string;
  },
  deps: VaultGrantDeps,
): Promise<VaultGrantResult> {
  const payment = await deps.findByOrderId(input.providerOrderId);
  if (!payment) {
    throw new BillingError("Payment not found.", 404, "payment_not_found");
  }
  if (input.expectedUserId && payment.userId !== input.expectedUserId) {
    throw new BillingError("This payment does not belong to your account.", 403, "payment_forbidden");
  }
  if (!payment.userId) {
    throw new BillingError("Payment is not linked to an account.", 409, "payment_unlinked");
  }

  const experienceId = parseVaultExperienceId(payment.planId);
  if (!experienceId) {
    throw new BillingError("Payment amount does not match the plan.", 409, "amount_mismatch");
  }

  const priceInr = await deps.readListingPriceInr(experienceId);
  if (priceInr == null || priceInr <= 0) {
    throw new BillingError("Experience not found.", 404, "vault_not_found");
  }
  const expectedPaise = Math.round(priceInr * 100);
  if (payment.amountPaise !== expectedPaise || payment.currency !== "INR") {
    throw new BillingError("Payment amount does not match the plan.", 409, "amount_mismatch");
  }

  if (payment.status === "paid") {
    await deps.markPurchaseVerified({
      buyerId: payment.userId,
      experienceId,
      providerPaymentId: input.providerPaymentId,
    });
    return { kind: "vault", unlocked: true, applied: false, experienceId };
  }

  const existingPayment = await deps.findByPaymentId(input.providerPaymentId);
  if (existingPayment?.status === "paid") {
    await deps.markPurchaseVerified({
      buyerId: payment.userId,
      experienceId,
      providerPaymentId: input.providerPaymentId,
    });
    return { kind: "vault", unlocked: true, applied: false, experienceId };
  }

  const claimed = await deps.claimCreated(payment.id, input.providerPaymentId, null);
  if (!claimed) {
    const again = await deps.findByOrderId(input.providerOrderId);
    if (again?.status === "paid" && again.userId) {
      await deps.markPurchaseVerified({
        buyerId: again.userId,
        experienceId,
        providerPaymentId: input.providerPaymentId,
      });
      return { kind: "vault", unlocked: true, applied: false, experienceId };
    }
    throw new BillingError("Could not record the payment.", 409, "grant_failed");
  }

  const marked = await deps.markPurchaseVerified({
    buyerId: payment.userId,
    experienceId,
    providerPaymentId: input.providerPaymentId,
  });
  return {
    kind: "vault",
    unlocked: true,
    applied: marked.applied,
    experienceId,
  };
}
