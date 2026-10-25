import { getPlan } from "./plans";
import { BillingError } from "./errors";

export type PaymentStatus = "created" | "paid" | "failed";

export type PaymentRecord = {
  id: string;
  userId: string | null;
  planId: string;
  amountPaise: number;
  currency: string;
  providerOrderId: string;
  providerPaymentId: string | null;
  status: PaymentStatus;
  grantedUntil: string | null;
};

export type GrantDeps = {
  now?: Date;
  findByOrderId: (orderId: string) => Promise<PaymentRecord | null>;
  findByPaymentId: (paymentId: string) => Promise<PaymentRecord | null>;
  /**
   * Move a `created` row to `paid` once. Return null when this call did not win
   * (already paid, or the payment id is already stored).
   */
  claimCreated: (
    paymentRowId: string,
    providerPaymentId: string,
    grantedUntil: string,
  ) => Promise<PaymentRecord | null>;
  readExpiry: (userId: string) => Promise<Date | null>;
  /** Set premium. Must not move an existing expiry earlier than `expiresAt`. */
  writePremium: (userId: string, expiresAt: string) => Promise<void>;
};

export type GrantResult = {
  grantedUntil: string;
  applied: boolean;
};

/** Next expiry is max(now, current expiry) plus the plan length. Stacking adds days to the later date. */
export function extendExpiry(current: Date | null, now: Date, days: number): Date {
  const currentMs = current && !Number.isNaN(current.getTime()) ? current.getTime() : 0;
  const base = Math.max(now.getTime(), currentMs);
  return new Date(base + days * 24 * 60 * 60 * 1000);
}

function requireGrantedUntil(row: PaymentRecord): string {
  if (!row.grantedUntil) {
    throw new BillingError("Could not record the payment.", 500, "grant_failed");
  }
  return row.grantedUntil;
}

/**
 * Apply one Razorpay payment id once. A second call with the same payment id
 * does not add more days. A second pass (different payment id) extends from
 * the later of now and the current expiry.
 */
export async function grantPass(
  input: {
    providerOrderId: string;
    providerPaymentId: string;
    expectedUserId?: string;
  },
  deps: GrantDeps,
): Promise<GrantResult> {
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

  const plan = getPlan(payment.planId);
  if (!plan || payment.amountPaise !== plan.amountPaise || payment.currency !== plan.currency) {
    throw new BillingError("Payment amount does not match the plan.", 409, "amount_mismatch");
  }

  if (payment.status === "paid") {
    const until = requireGrantedUntil(payment);
    await deps.writePremium(payment.userId, until);
    return { grantedUntil: until, applied: false };
  }

  const existingPayment = await deps.findByPaymentId(input.providerPaymentId);
  if (existingPayment?.status === "paid" && existingPayment.grantedUntil) {
    return { grantedUntil: existingPayment.grantedUntil, applied: false };
  }

  const now = deps.now ?? new Date();
  const currentExpiry = await deps.readExpiry(payment.userId);
  const next = extendExpiry(currentExpiry, now, plan.days);
  const grantedUntil = next.toISOString();

  const claimed = await deps.claimCreated(payment.id, input.providerPaymentId, grantedUntil);
  if (!claimed) {
    const again = await deps.findByOrderId(input.providerOrderId);
    if (again?.status === "paid" && again.grantedUntil && again.userId) {
      await deps.writePremium(again.userId, again.grantedUntil);
      return { grantedUntil: again.grantedUntil, applied: false };
    }
    throw new BillingError("Could not record the payment.", 409, "grant_failed");
  }

  await deps.writePremium(payment.userId, grantedUntil);
  return { grantedUntil, applied: true };
}
