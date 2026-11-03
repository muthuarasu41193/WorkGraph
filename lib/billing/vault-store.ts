import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { parseVaultPaymentStatus } from "@/lib/vault";

import { BillingError } from "./errors";
import type { VaultListingForOrder, VaultPurchaseForOrder } from "./vault-order";

function admin() {
  const client = createSupabaseAdminClient();
  if (!client) {
    throw new BillingError("Payments are not available right now.", 503, "billing_unconfigured");
  }
  return client;
}

export async function loadVaultListingForOrder(experienceId: string): Promise<VaultListingForOrder | null> {
  const { data, error } = await admin()
    .from("vault_experiences")
    .select("id, seller_id, status, price_inr")
    .eq("id", experienceId)
    .maybeSingle();
  if (error) {
    throw new BillingError("Could not start the payment. Please try again.", 500, "vault_lookup_failed");
  }
  if (!data) return null;
  const row = data as { id: string; seller_id: string; status: string; price_inr: number };
  return {
    id: row.id,
    sellerId: row.seller_id,
    status: row.status,
    priceInr: Number(row.price_inr ?? 0),
  };
}

export async function loadVaultPurchaseForOrder(
  experienceId: string,
  buyerId: string,
): Promise<VaultPurchaseForOrder> {
  const { data, error } = await admin()
    .from("vault_purchases")
    .select("id, payment_status")
    .eq("experience_id", experienceId)
    .eq("buyer_id", buyerId)
    .maybeSingle();
  if (error) {
    throw new BillingError("Could not start the payment. Please try again.", 500, "vault_lookup_failed");
  }
  if (!data) return null;
  const row = data as { id: string; payment_status: unknown };
  return {
    id: row.id,
    paymentStatus: parseVaultPaymentStatus(row.payment_status),
  };
}

/**
 * Reuse a pending intent row, or insert one. Always scopes to the session buyer.
 * Returns the purchase row id.
 */
export async function ensurePendingVaultPurchase(input: {
  experienceId: string;
  buyerId: string;
  amountInr: number;
  existingPurchaseId: string | null;
}): Promise<string> {
  if (input.existingPurchaseId) return input.existingPurchaseId;

  const { data, error } = await admin()
    .from("vault_purchases")
    .insert({
      experience_id: input.experienceId,
      buyer_id: input.buyerId,
      amount_inr: input.amountInr,
      payment_status: "pending",
    })
    .select("id")
    .maybeSingle();

  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "23505") {
      const again = await loadVaultPurchaseForOrder(input.experienceId, input.buyerId);
      if (again?.paymentStatus === "verified") {
        throw new BillingError("Already purchased.", 400, "vault_already_purchased");
      }
      if (again) return again.id;
    }
    throw new BillingError("Could not record purchase intent.", 500, "vault_intent_failed");
  }
  if (!data || typeof (data as { id?: unknown }).id !== "string") {
    throw new BillingError("Could not record purchase intent.", 500, "vault_intent_failed");
  }
  return (data as { id: string }).id;
}

/** Store the Razorpay order id on the pending purchase (service role; buyers cannot UPDATE). */
export async function attachVaultOrderReference(input: {
  purchaseId: string;
  buyerId: string;
  providerOrderId: string;
}): Promise<void> {
  const { data, error } = await admin()
    .from("vault_purchases")
    .update({
      payment_reference: input.providerOrderId,
      payment_provider: "razorpay",
    })
    .eq("id", input.purchaseId)
    .eq("buyer_id", input.buyerId)
    .eq("payment_status", "pending")
    .select("id")
    .maybeSingle();
  if (error || !data) {
    throw new BillingError("Could not start the payment. Please try again.", 500, "vault_intent_failed");
  }
}

export async function readVaultListingPriceInr(experienceId: string): Promise<number | null> {
  const listing = await loadVaultListingForOrder(experienceId);
  if (!listing || listing.status !== "published") return null;
  return listing.priceInr;
}

/**
 * Idempotent verify: pending → verified, or already verified stays verified.
 * Sets payment_provider and payment_reference to the Razorpay payment id.
 */
export async function markVaultPurchaseVerified(input: {
  buyerId: string;
  experienceId: string;
  providerPaymentId: string;
}): Promise<{ applied: boolean }> {
  const existing = await loadVaultPurchaseForOrder(input.experienceId, input.buyerId);

  if (existing?.paymentStatus === "verified") {
    const { error } = await admin()
      .from("vault_purchases")
      .update({
        payment_provider: "razorpay",
        payment_reference: input.providerPaymentId,
      })
      .eq("id", existing.id)
      .eq("buyer_id", input.buyerId)
      .eq("payment_status", "verified");
    if (error) {
      throw new BillingError("Could not record the payment.", 500, "grant_failed");
    }
    return { applied: false };
  }

  if (existing) {
    const { data, error } = await admin()
      .from("vault_purchases")
      .update({
        payment_status: "verified",
        payment_provider: "razorpay",
        payment_reference: input.providerPaymentId,
      })
      .eq("id", existing.id)
      .eq("buyer_id", input.buyerId)
      .eq("payment_status", "pending")
      .select("id")
      .maybeSingle();
    if (error) {
      throw new BillingError("Could not record the payment.", 500, "grant_failed");
    }
    if (data) return { applied: true };
    // Lost the race to another verifier — treat as already applied.
    const again = await loadVaultPurchaseForOrder(input.experienceId, input.buyerId);
    if (again?.paymentStatus === "verified") return { applied: false };
    throw new BillingError("Could not record the payment.", 500, "grant_failed");
  }

  // Intent row missing (rare): insert verified via service role for accounting consistency.
  const listing = await loadVaultListingForOrder(input.experienceId);
  const amountInr = listing && listing.priceInr > 0 ? Math.round(listing.priceInr) : 0;
  const { error } = await admin().from("vault_purchases").insert({
    experience_id: input.experienceId,
    buyer_id: input.buyerId,
    amount_inr: amountInr,
    payment_status: "verified",
    payment_provider: "razorpay",
    payment_reference: input.providerPaymentId,
  });
  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "23505") return { applied: false };
    throw new BillingError("Could not record the payment.", 500, "grant_failed");
  }
  return { applied: true };
}
