import { BillingError } from "./errors";

const ORDERS_URL = "https://api.razorpay.com/v1/orders";

export type RazorpayOrderInput = {
  amountPaise: number;
  currency: "INR";
  receipt: string;
  notes: { user_id: string; plan_id: string };
};

export type RazorpayOrderResult = {
  id: string;
  amount: number;
  currency: string;
};

/**
 * Create a Razorpay order with fetch + HTTP Basic auth.
 * Notes carry the internal user id and plan id only. Never resume text, email, or phone.
 */
export async function createRazorpayOrder(
  input: RazorpayOrderInput & { keyId: string; keySecret: string },
  fetchImpl: typeof fetch = fetch,
): Promise<RazorpayOrderResult> {
  if (!input.keyId || !input.keySecret) {
    throw new BillingError("Payments are not available right now.", 503, "billing_unconfigured");
  }
  if (input.receipt.length > 40) {
    throw new BillingError("Could not start the payment. Please try again.", 500, "razorpay_order_failed");
  }

  const body = {
    amount: input.amountPaise,
    currency: input.currency,
    receipt: input.receipt,
    notes: {
      user_id: input.notes.user_id,
      plan_id: input.notes.plan_id,
    },
  };

  let response: Response;
  try {
    response = await fetchImpl(ORDERS_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${input.keyId}:${input.keySecret}`, "utf8").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new BillingError("Could not start the payment. Please try again.", 502, "razorpay_order_failed");
  }

  const text = await response.text();
  if (!response.ok) {
    throw new BillingError("Could not start the payment. Please try again.", 502, "razorpay_order_failed");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new BillingError("Could not start the payment. Please try again.", 502, "razorpay_order_failed");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new BillingError("Could not start the payment. Please try again.", 502, "razorpay_order_failed");
  }
  const row = parsed as Record<string, unknown>;
  const id = row.id;
  const amount = row.amount;
  const currency = row.currency;
  if (typeof id !== "string" || !id || typeof amount !== "number" || typeof currency !== "string") {
    throw new BillingError("Could not start the payment. Please try again.", 502, "razorpay_order_failed");
  }
  if (amount !== input.amountPaise || currency !== input.currency) {
    throw new BillingError("Could not start the payment. Please try again.", 502, "amount_mismatch");
  }
  return { id, amount, currency };
}
