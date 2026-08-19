export const VAULT_PAYMENT_STATUSES = ["pending", "verified", "failed"] as const;
export type VaultPaymentStatus = (typeof VAULT_PAYMENT_STATUSES)[number];

export type VaultPurchaseRecord = {
  payment_status: VaultPaymentStatus;
} | null;

export function isVaultPaymentStatus(value: string): value is VaultPaymentStatus {
  return (VAULT_PAYMENT_STATUSES as readonly string[]).includes(value);
}

export function isVaultListingFree(priceInr: number): boolean {
  return Number.isFinite(priceInr) && priceInr <= 0;
}

/**
 * Entitlement is not "a purchase row exists".
 * Owner, free listing, or a verified payment only.
 */
export function hasVaultEntitlement(input: {
  viewerId: string | null;
  sellerId: string;
  priceInr: number;
  purchase: VaultPurchaseRecord;
}): boolean {
  if (input.viewerId && input.viewerId === input.sellerId) return true;
  if (isVaultListingFree(input.priceInr)) return true;
  return input.purchase?.payment_status === "verified";
}

export function vaultPurchaseUnlocksContent(purchase: VaultPurchaseRecord, priceInr: number): boolean {
  if (isVaultListingFree(priceInr)) return true;
  return purchase?.payment_status === "verified";
}
