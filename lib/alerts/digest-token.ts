/**
 * Signed unsubscribe tokens for alert digests.
 * Secret: DIGEST_UNSUBSCRIBE_SECRET (server-only).
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export type DigestUnsubscribePayload = {
  /** Alert uuid, or "all" for every alert owned by the user. */
  alertId: string;
  userId: string;
  /** Unix seconds expiry. */
  exp: number;
};

const TOKEN_TTL_SEC = 60 * 60 * 24 * 90; // 90 days

function getSecret(): string | null {
  const secret = process.env.DIGEST_UNSUBSCRIBE_SECRET?.trim();
  return secret || null;
}

function b64urlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function b64urlDecode(value: string): string | null {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function sign(message: string, secret: string): string {
  return createHmac("sha256", secret).update(message, "utf8").digest("base64url");
}

function signaturesEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Build a URL-safe token. Returns null when the secret is missing. */
export function signDigestUnsubscribeToken(
  input: { alertId: string; userId: string; nowSec?: number; ttlSec?: number },
  secret = getSecret(),
): string | null {
  if (!secret) return null;
  const now = input.nowSec ?? Math.floor(Date.now() / 1000);
  const payload: DigestUnsubscribePayload = {
    alertId: input.alertId,
    userId: input.userId,
    exp: now + (input.ttlSec ?? TOKEN_TTL_SEC),
  };
  const body = b64urlEncode(JSON.stringify(payload));
  const sig = sign(body, secret);
  return `${body}.${sig}`;
}

/** Verify token. Returns null on missing secret, bad signature, expiry, or malformed payload. */
export function verifyDigestUnsubscribeToken(
  token: string,
  options?: { nowSec?: number; secret?: string | null },
): DigestUnsubscribePayload | null {
  const secret = options?.secret === undefined ? getSecret() : options.secret;
  if (!secret || !token || !token.includes(".")) return null;

  const dot = token.indexOf(".");
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!body || !sig) return null;

  const expected = sign(body, secret);
  if (!signaturesEqual(expected, sig)) return null;

  const raw = b64urlDecode(body);
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const record = parsed as Record<string, unknown>;
  const alertId = typeof record.alertId === "string" ? record.alertId : "";
  const userId = typeof record.userId === "string" ? record.userId : "";
  const exp = typeof record.exp === "number" ? record.exp : NaN;
  if (!alertId || !userId || !Number.isFinite(exp)) return null;

  const now = options?.nowSec ?? Math.floor(Date.now() / 1000);
  if (exp < now) return null;

  if (alertId !== "all" && !/^[0-9a-f-]{36}$/i.test(alertId)) return null;
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return null;

  return { alertId, userId, exp };
}
