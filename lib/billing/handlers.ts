import { NextResponse } from "next/server";

import { logErrorCode, logRouteError } from "@/lib/security/log";
import { isValidationError, parseJsonBody, publicErrorResponse } from "@/lib/validation";
import { razorpayOrderBodySchema, razorpayVerifyBodySchema } from "@/lib/validation/billing";

import { BillingError, isBillingError } from "./errors";
import type { GrantResult } from "./grant";
import { getPlan } from "./plans";
import { verifyPaymentSignature, verifyWebhookSignature } from "./signature";

const SIGN_IN = "Sign in to buy a WorkGraph Pass.";

type SessionUser = { id: string };

export type CreateOrderDeps = {
  getSessionUser: (request: Request) => Promise<SessionUser | null>;
  keyId: () => string;
  createOrder: (input: {
    amountPaise: number;
    currency: "INR";
    receipt: string;
    notes: { user_id: string; plan_id: string };
  }) => Promise<{ id: string; amount: number; currency: string }>;
  insertPayment: (row: {
    id: string;
    userId: string;
    planId: string;
    amountPaise: number;
    currency: string;
    providerOrderId: string;
  }) => Promise<void>;
  newId?: () => string;
};

export type VerifyDeps = {
  getSessionUser: (request: Request) => Promise<SessionUser | null>;
  keySecret: () => string;
  grant: (
    input: { providerOrderId: string; providerPaymentId: string; expectedUserId?: string },
  ) => Promise<GrantResult>;
};

export type WebhookDeps = {
  webhookSecret: () => string;
  grant: (
    input: { providerOrderId: string; providerPaymentId: string },
  ) => Promise<GrantResult>;
};

function billingResponse(error: unknown, route: string): NextResponse {
  if (isBillingError(error)) {
    logErrorCode(route, error.code);
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (isValidationError(error)) {
    return publicErrorResponse(error, { fallback: "Invalid request." });
  }
  logRouteError(route, error);
  return publicErrorResponse(error, { fallback: "Could not complete the payment." });
}

export async function handleCreateOrder(request: Request, deps: CreateOrderDeps): Promise<NextResponse> {
  const route = "billing/razorpay/order";
  try {
    const user = await deps.getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: SIGN_IN }, { status: 401 });
    }

    const body = await parseJsonBody(request, razorpayOrderBodySchema);
    const plan = getPlan(body.planId);
    if (!plan) {
      throw new BillingError("That plan is not available.", 400, "unknown_plan");
    }
    const keyId = deps.keyId().trim();
    if (!keyId) {
      throw new BillingError("Payments are not available right now.", 503, "billing_unconfigured");
    }

    const id = (deps.newId ?? (() => crypto.randomUUID()))();
    const created = await deps.createOrder({
      amountPaise: plan.amountPaise,
      currency: plan.currency,
      receipt: id,
      notes: { user_id: user.id, plan_id: plan.id },
    });
    if (created.amount !== plan.amountPaise || created.currency !== plan.currency) {
      throw new BillingError("Could not start the payment. Please try again.", 502, "amount_mismatch");
    }

    await deps.insertPayment({
      id,
      userId: user.id,
      planId: plan.id,
      amountPaise: plan.amountPaise,
      currency: plan.currency,
      providerOrderId: created.id,
    });

    return NextResponse.json({
      orderId: created.id,
      amount: plan.amountPaise,
      currency: plan.currency,
      keyId,
    });
  } catch (error) {
    return billingResponse(error, route);
  }
}

export async function handleVerifyPayment(request: Request, deps: VerifyDeps): Promise<NextResponse> {
  const route = "billing/razorpay/verify";
  try {
    const user = await deps.getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: SIGN_IN }, { status: 401 });
    }
    const body = await parseJsonBody(request, razorpayVerifyBodySchema);
    const secret = deps.keySecret().trim();
    if (!secret) {
      throw new BillingError("Payments are not available right now.", 503, "billing_unconfigured");
    }
    const valid = verifyPaymentSignature({
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
      keySecret: secret,
    });
    if (!valid) {
      throw new BillingError("Payment could not be verified.", 400, "razorpay_signature_invalid");
    }
    const result = await deps.grant({
      providerOrderId: body.razorpay_order_id,
      providerPaymentId: body.razorpay_payment_id,
      expectedUserId: user.id,
    });
    return NextResponse.json({ ok: true, grantedUntil: result.grantedUntil });
  } catch (error) {
    return billingResponse(error, route);
  }
}

type CapturedPayment = { orderId: string; paymentId: string };

export function readCapturedPayment(event: unknown): CapturedPayment | null {
  if (!event || typeof event !== "object") return null;
  const row = event as { event?: unknown; payload?: unknown };
  if (row.event !== "payment.captured" && row.event !== "order.paid") return null;
  const payload = row.payload;
  if (!payload || typeof payload !== "object") return null;
  const paymentEntity = (payload as { payment?: { entity?: { id?: unknown; order_id?: unknown } } }).payment
    ?.entity;
  const orderEntity = (payload as { order?: { entity?: { id?: unknown } } }).order?.entity;
  const paymentId = paymentEntity?.id;
  const orderId = paymentEntity?.order_id ?? orderEntity?.id;
  if (typeof paymentId !== "string" || !paymentId) return null;
  if (typeof orderId !== "string" || !orderId) return null;
  return { orderId, paymentId };
}

export async function handleWebhook(request: Request, deps: WebhookDeps): Promise<NextResponse> {
  const route = "billing/razorpay/webhook";
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const secret = deps.webhookSecret().trim();
  if (!secret || !verifyWebhookSignature(raw, signature, secret)) {
    logErrorCode(route, "razorpay_webhook_invalid");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: unknown;
  try {
    event = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const name = event && typeof event === "object" ? (event as { event?: unknown }).event : null;
  if (name !== "payment.captured" && name !== "order.paid") {
    return NextResponse.json({ ok: true });
  }

  const captured = readCapturedPayment(event);
  if (!captured) {
    return NextResponse.json({ ok: true });
  }

  try {
    await deps.grant({
      providerOrderId: captured.orderId,
      providerPaymentId: captured.paymentId,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isBillingError(error) && (error.code === "payment_not_found" || error.code === "payment_unlinked")) {
      logErrorCode(route, error.code);
      return NextResponse.json({ ok: true });
    }
    if (isBillingError(error)) {
      logErrorCode(route, error.code);
      return NextResponse.json({ error: "Could not record the payment." }, { status: 500 });
    }
    logRouteError(route, error);
    return NextResponse.json({ error: "Could not record the payment." }, { status: 500 });
  }
}
