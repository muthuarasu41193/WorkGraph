import { createSupabaseAdminClient } from "@/lib/supabase-admin";

import { BillingError } from "./errors";
import type { PaymentRecord, PaymentStatus } from "./grant";

type PaymentRow = {
  id: string;
  user_id: string | null;
  plan_id: string;
  amount_paise: number;
  currency: string;
  provider_order_id: string;
  provider_payment_id: string | null;
  status: string;
  granted_until: string | null;
};

const PAYMENT_COLUMNS =
  "id, user_id, plan_id, amount_paise, currency, provider_order_id, provider_payment_id, status, granted_until";

function admin() {
  const client = createSupabaseAdminClient();
  if (!client) {
    throw new BillingError("Payments are not available right now.", 503, "billing_unconfigured");
  }
  return client;
}

function asStatus(value: string): PaymentStatus | null {
  if (value === "created" || value === "paid" || value === "failed") return value;
  return null;
}

function mapPayment(row: PaymentRow): PaymentRecord | null {
  const status = asStatus(row.status);
  if (!status || typeof row.id !== "string" || typeof row.plan_id !== "string") return null;
  if (typeof row.amount_paise !== "number" || typeof row.currency !== "string") return null;
  if (typeof row.provider_order_id !== "string") return null;
  return {
    id: row.id,
    userId: typeof row.user_id === "string" ? row.user_id : null,
    planId: row.plan_id,
    amountPaise: row.amount_paise,
    currency: row.currency,
    providerOrderId: row.provider_order_id,
    providerPaymentId: typeof row.provider_payment_id === "string" ? row.provider_payment_id : null,
    status,
    grantedUntil: typeof row.granted_until === "string" ? row.granted_until : null,
  };
}

export async function findPaymentByOrderId(orderId: string): Promise<PaymentRecord | null> {
  const { data, error } = await admin()
    .from("payments")
    .select(PAYMENT_COLUMNS)
    .eq("provider_order_id", orderId)
    .maybeSingle();
  if (error) {
    throw new BillingError("Could not record the payment.", 500, "grant_failed");
  }
  return data ? mapPayment(data as PaymentRow) : null;
}

export async function findPaymentByPaymentId(paymentId: string): Promise<PaymentRecord | null> {
  const { data, error } = await admin()
    .from("payments")
    .select(PAYMENT_COLUMNS)
    .eq("provider_payment_id", paymentId)
    .maybeSingle();
  if (error) {
    throw new BillingError("Could not record the payment.", 500, "grant_failed");
  }
  return data ? mapPayment(data as PaymentRow) : null;
}

export async function insertCreatedPayment(row: {
  id: string;
  userId: string;
  planId: string;
  amountPaise: number;
  currency: string;
  providerOrderId: string;
}): Promise<void> {
  const { error } = await admin().from("payments").insert({
    id: row.id,
    user_id: row.userId,
    provider: "razorpay",
    plan_id: row.planId,
    amount_paise: row.amountPaise,
    currency: row.currency,
    provider_order_id: row.providerOrderId,
    status: "created",
  });
  if (error) {
    throw new BillingError("Could not start the payment. Please try again.", 500, "razorpay_order_failed");
  }
}

export async function claimCreatedPayment(
  paymentRowId: string,
  providerPaymentId: string,
  grantedUntil: string,
): Promise<PaymentRecord | null> {
  const { data, error } = await admin()
    .from("payments")
    .update({
      status: "paid",
      provider_payment_id: providerPaymentId,
      granted_until: grantedUntil,
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentRowId)
    .eq("status", "created")
    .select(PAYMENT_COLUMNS)
    .maybeSingle();
  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "23505") return null;
    throw new BillingError("Could not record the payment.", 500, "grant_failed");
  }
  return data ? mapPayment(data as PaymentRow) : null;
}

export async function readSubscriptionExpiry(userId: string): Promise<Date | null> {
  const { data, error } = await admin()
    .from("profiles")
    .select("subscription_expires_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    throw new BillingError("Could not record the payment.", 500, "grant_failed");
  }
  const raw = (data as { subscription_expires_at?: unknown } | null)?.subscription_expires_at;
  if (typeof raw !== "string") return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function writePremiumUntil(userId: string, expiresAt: string): Promise<void> {
  const current = await readSubscriptionExpiry(userId);
  const next = new Date(expiresAt);
  if (Number.isNaN(next.getTime())) {
    throw new BillingError("Could not record the payment.", 500, "grant_failed");
  }
  const chosen = current && current.getTime() > next.getTime() ? current.toISOString() : next.toISOString();
  const { data, error } = await admin()
    .from("profiles")
    .update({
      subscription_tier: "premium",
      subscription_expires_at: chosen,
    })
    .eq("id", userId)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    throw new BillingError("Could not record the payment.", 500, "grant_failed");
  }
}
