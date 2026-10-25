import { createHmac, timingSafeEqual } from "node:crypto";

/** HMAC-SHA256 hex digest. Razorpay signs `order_id|payment_id` and the raw webhook body. */
export function hmacSha256Hex(secret: string, message: string): string {
  return createHmac("sha256", secret).update(message, "utf8").digest("hex");
}

export function paymentSignatureMessage(orderId: string, paymentId: string): string {
  return `${orderId}|${paymentId}`;
}

/** Constant-time compare of two hex signatures. Different lengths are a mismatch, not a throw. */
export function signaturesMatch(expectedHex: string, received: string): boolean {
  const left = expectedHex.trim().toLowerCase();
  const right = received.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(left) || !/^[0-9a-f]+$/.test(right)) return false;
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string;
}): boolean {
  if (!input.keySecret) return false;
  const expected = hmacSha256Hex(
    input.keySecret,
    paymentSignatureMessage(input.orderId, input.paymentId),
  );
  return signaturesMatch(expected, input.signature);
}

export function verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean {
  if (!webhookSecret || !signature) return false;
  const expected = hmacSha256Hex(webhookSecret, rawBody);
  return signaturesMatch(expected, signature);
}
