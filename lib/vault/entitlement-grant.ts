/**
 * Pure vault entitlement grant decisions.
 * Amounts always come from the server listing price — never from the client.
 * A "verified" status without a valid provider confirmation is treated as forged.
 */

import {
  hasVaultEntitlement,
  isVaultListingFree,
  type VaultPaymentStatus,
  type VaultPurchaseRecord,
} from "@/lib/security/vault-entitlement";

export type VaultGrantDecision =
  | {
      grant: true;
      entitlement: "granted";
      payment_status: "verified";
      amountInr: number;
      reason: "free_listing" | "owner" | "verified_payment";
    }
  | {
      grant: false;
      entitlement: "pending" | "denied";
      payment_status: VaultPaymentStatus | "none";
      amountInr: number;
      reason:
        | "pending_payment"
        | "failed_payment"
        | "forged_confirmation"
        | "replay_pending"
        | "already_verified"
        | "price_mismatch"
        | "not_purchased";
    };

export type VaultPaymentConfirmationInput = {
  viewerId: string | null;
  sellerId: string;
  /** Server listing price in INR. */
  listingPriceInr: number;
  /** Existing purchase row, if any. */
  purchase: VaultPurchaseRecord;
  /**
   * Claimed confirmation from a client or webhook body.
   * Without providerSignatureValid === true, payment_status "verified" is forged.
   */
  confirmation?: {
    payment_status: VaultPaymentStatus;
    /** Client-supplied price — ignored for grant amount; mismatch denies. */
    claimedAmountInr?: number;
    providerSignatureValid?: boolean;
    providerPaymentId?: string | null;
  } | null;
};

/**
 * Decide whether to grant vault content access from purchase + optional confirmation.
 * Idempotent: already-verified purchases grant again as already_verified/granted.
 */
export function decideVaultEntitlementGrant(input: VaultPaymentConfirmationInput): VaultGrantDecision {
  const amountInr = Number.isFinite(input.listingPriceInr) ? Math.max(0, input.listingPriceInr) : 0;

  if (input.viewerId && input.viewerId === input.sellerId) {
    return {
      grant: true,
      entitlement: "granted",
      payment_status: "verified",
      amountInr,
      reason: "owner",
    };
  }

  if (isVaultListingFree(amountInr)) {
    return {
      grant: true,
      entitlement: "granted",
      payment_status: "verified",
      amountInr: 0,
      reason: "free_listing",
    };
  }

  if (input.purchase?.payment_status === "verified") {
    return {
      grant: true,
      entitlement: "granted",
      payment_status: "verified",
      amountInr,
      reason: "verified_payment",
    };
  }

  const confirmation = input.confirmation;
  if (confirmation) {
    if (
      confirmation.claimedAmountInr != null &&
      Number.isFinite(confirmation.claimedAmountInr) &&
      confirmation.claimedAmountInr !== amountInr
    ) {
      return {
        grant: false,
        entitlement: "denied",
        payment_status: confirmation.payment_status,
        amountInr,
        reason: "price_mismatch",
      };
    }

    if (confirmation.payment_status === "verified") {
      const signatureOk = confirmation.providerSignatureValid === true;
      const hasPaymentId =
        typeof confirmation.providerPaymentId === "string" &&
        confirmation.providerPaymentId.trim().length > 0;
      if (!signatureOk || !hasPaymentId) {
        return {
          grant: false,
          entitlement: "denied",
          payment_status: "pending",
          amountInr,
          reason: "forged_confirmation",
        };
      }
      return {
        grant: true,
        entitlement: "granted",
        payment_status: "verified",
        amountInr,
        reason: "verified_payment",
      };
    }

    if (confirmation.payment_status === "failed") {
      return {
        grant: false,
        entitlement: "denied",
        payment_status: "failed",
        amountInr,
        reason: "failed_payment",
      };
    }
  }

  if (input.purchase?.payment_status === "pending") {
    return {
      grant: false,
      entitlement: "pending",
      payment_status: "pending",
      amountInr,
      reason: "replay_pending",
    };
  }

  if (input.purchase?.payment_status === "failed") {
    return {
      grant: false,
      entitlement: "denied",
      payment_status: "failed",
      amountInr,
      reason: "failed_payment",
    };
  }

  const entitled = hasVaultEntitlement({
    viewerId: input.viewerId,
    sellerId: input.sellerId,
    priceInr: amountInr,
    purchase: input.purchase,
  });

  if (entitled) {
    return {
      grant: true,
      entitlement: "granted",
      payment_status: "verified",
      amountInr,
      reason: "verified_payment",
    };
  }

  return {
    grant: false,
    entitlement: "pending",
    payment_status: input.purchase?.payment_status ?? "none",
    amountInr,
    reason: "not_purchased",
  };
}

/** True when a second confirmation for an already-verified purchase should no-op as success. */
export function isIdempotentVerifiedReplay(purchase: VaultPurchaseRecord): boolean {
  return purchase?.payment_status === "verified";
}
