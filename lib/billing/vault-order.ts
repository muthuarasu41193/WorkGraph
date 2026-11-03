import { BillingError } from "./errors";
import { inrToPaise, vaultPlanId } from "./vault-plan";

export type VaultListingForOrder = {
  id: string;
  sellerId: string;
  status: string;
  priceInr: number;
};

export type VaultPurchaseForOrder = {
  id: string;
  paymentStatus: "pending" | "verified" | "failed";
} | null;

/**
 * Pure eligibility for a vault Razorpay order.
 * Amount always comes from the listing price — never from the client body.
 */
export function resolveVaultOrderAmount(input: {
  buyerId: string;
  listing: VaultListingForOrder | null;
  purchase: VaultPurchaseForOrder;
}): {
  experienceId: string;
  amountPaise: number;
  currency: "INR";
  planId: string;
  existingPurchaseId: string | null;
} {
  const listing = input.listing;
  if (!listing || listing.status !== "published") {
    throw new BillingError("Experience not found.", 404, "vault_not_found");
  }
  if (listing.sellerId === input.buyerId) {
    throw new BillingError("You already own this experience.", 400, "vault_own_listing");
  }
  const amountPaise = inrToPaise(listing.priceInr);
  if (amountPaise <= 0) {
    throw new BillingError("This listing is free and does not need payment.", 400, "vault_free");
  }
  if (input.purchase?.paymentStatus === "verified") {
    throw new BillingError("Already purchased.", 400, "vault_already_purchased");
  }
  return {
    experienceId: listing.id,
    amountPaise,
    currency: "INR",
    planId: vaultPlanId(listing.id),
    existingPurchaseId: input.purchase?.paymentStatus === "pending" ? input.purchase.id : null,
  };
}
