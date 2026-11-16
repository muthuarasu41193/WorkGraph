import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Raw share token length in bytes before base64url encoding. */
export const PREP_PACK_SHARE_TOKEN_BYTES = 32;

/** Default link lifetime from creation (90 days). */
export const PREP_PACK_SHARE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

/** Max active (non-revoked, non-expired) shares per pack. */
export const PREP_PACK_SHARE_MAX_PER_PACK = 5;

export type GeneratedShareToken = {
  /** Unguessable secret for the URL. Shown once; never stored. */
  token: string;
  /** SHA-256 hex of the token (lowercase). Persisted. */
  tokenHash: string;
};

/** Cryptographically random URL-safe token + SHA-256 hash for storage. */
export function generatePrepPackShareToken(
  random: (size: number) => Buffer = randomBytes,
): GeneratedShareToken {
  const token = random(PREP_PACK_SHARE_TOKEN_BYTES).toString("base64url");
  return { token, tokenHash: hashPrepPackShareToken(token) };
}

export function hashPrepPackShareToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Constant-time compare of two hex digests. */
export function shareTokenHashesEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

export function defaultShareExpiresAt(now = Date.now()): string {
  return new Date(now + PREP_PACK_SHARE_TTL_MS).toISOString();
}

/** Accept only the raw token shape we mint (base64url, expected length). */
export function isPlausibleShareToken(token: string): boolean {
  if (typeof token !== "string") return false;
  const trimmed = token.trim();
  // 32 bytes → 43 base64url chars without padding.
  if (trimmed.length < 40 || trimmed.length > 64) return false;
  return /^[A-Za-z0-9_-]+$/.test(trimmed);
}
