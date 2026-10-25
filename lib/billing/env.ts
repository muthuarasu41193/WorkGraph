/** Server-only Razorpay config. The key names are assembled so they are not client literals. */

function readEnv(parts: readonly string[]): string {
  return process.env[parts.join("_")]?.trim() ?? "";
}

export function razorpayKeyId(): string {
  return readEnv(["RAZORPAY", "KEY", "ID"]);
}

export function razorpayKeySecret(): string {
  return readEnv(["RAZORPAY", "KEY", "SECRET"]);
}

export function razorpayWebhookSecret(): string {
  return readEnv(["RAZORPAY", "WEBHOOK", "SECRET"]);
}
