/**
 * Interview Vault Milestone V2 — current company email confirmation helpers.
 *
 * Pure validation/hashing/constants. Durable claims use V1 contributor_verifications
 * with claim_type current_company_email and method company_email_challenge.
 * Clients never set or upgrade verification status.
 *
 * Privacy: never put the work email or one-time code in logs, URLs, analytics,
 * or public API responses. After successful confirmation keep nothing of the
 * email (including domain) by default.
 */

import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

/** One-time code lifetime (default 10 minutes). */
export const COMPANY_EMAIL_CODE_TTL_MS = 10 * 60 * 1000;

/** Durable claim lifetime after confirmation (default 12 months). */
export const COMPANY_EMAIL_CLAIM_TTL_MS = 365 * 24 * 60 * 60 * 1000;

export const COMPANY_EMAIL_MAX_ATTEMPTS = 5;

export const COMPANY_EMAIL_CODE_LENGTH = 6;

/** Rate limits for start/resend (existing in-memory checkRateLimit). */
export const COMPANY_EMAIL_RATE_LIMIT_USER = 5;
export const COMPANY_EMAIL_RATE_LIMIT_ADDRESS = 3;
export const COMPANY_EMAIL_RATE_LIMIT_DOMAIN = 10;
export const COMPANY_EMAIL_RATE_WINDOW_MS = 60 * 60 * 1000;

/**
 * Configurable free-mail / consumer domains rejected for company-email claims.
 * Extend this list in code review; do not accept client-supplied allowlists.
 */
export const COMPANY_EMAIL_FREE_MAIL_DOMAINS: readonly string[] = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "gmx.com",
  "gmx.net",
  "fastmail.com",
  "tutanota.com",
  "hey.com",
  "pm.me",
];

const FREE_MAIL_SET = new Set(COMPANY_EMAIL_FREE_MAIL_DOMAINS.map((d) => d.toLowerCase()));

export type CompanyEmailValidationOk = {
  ok: true;
  email: string;
  domain: string;
};

export type CompanyEmailValidationErr = {
  ok: false;
  error: "invalid_format" | "free_mail_domain" | "too_long";
};

export type CompanyEmailValidationResult = CompanyEmailValidationOk | CompanyEmailValidationErr;

/** NEEDS COUNSEL REVIEW — contributor-facing privacy and limits copy. */
export const COMPANY_EMAIL_PRIVACY_NOTE =
  "We use your work email only to send a one-time confirmation code. After you confirm, we do not keep the email address or its domain. Buyers never see your email. Confirmation shows that you had access to a supported company mailbox at that time — not that your guide matches that employer, and not that the guide is accurate. NEEDS COUNSEL REVIEW.";

/** NEEDS COUNSEL REVIEW — what is / is not proven. */
export const COMPANY_EMAIL_WHAT_IT_PROVES =
  "What this proves: access to a non–free-mail inbox at confirmation time. What it does not prove: employment status, identity match to the guide’s company, interview accuracy, or a hiring outcome. NEEDS COUNSEL REVIEW.";

const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export function normalizeCompanyEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function extractCompanyEmailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const domain = email.slice(at + 1).trim().toLowerCase();
  return domain.length > 1 ? domain : null;
}

export function isFreeMailDomain(domain: string): boolean {
  return FREE_MAIL_SET.has(domain.trim().toLowerCase());
}

export function validateCompanyEmailInput(raw: unknown): CompanyEmailValidationResult {
  if (typeof raw !== "string") return { ok: false, error: "invalid_format" };
  if (raw.length > 254) return { ok: false, error: "too_long" };
  const email = normalizeCompanyEmail(raw);
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return { ok: false, error: "invalid_format" };
  }
  const domain = extractCompanyEmailDomain(email);
  if (!domain) return { ok: false, error: "invalid_format" };
  if (isFreeMailDomain(domain)) return { ok: false, error: "free_mail_domain" };
  return { ok: true, email, domain };
}

export function validateCompanyEmailCodeInput(raw: unknown): { ok: true; code: string } | { ok: false } {
  if (typeof raw !== "string") return { ok: false };
  const code = raw.trim().replace(/\s+/g, "");
  if (!/^\d{6}$/.test(code)) return { ok: false };
  return { ok: true, code };
}

/** Stable digest for rate-limit keys and challenge matching. Never log the input. */
export function hashCompanyEmail(email: string): string {
  return createHash("sha256").update(normalizeCompanyEmail(email), "utf8").digest("hex");
}

export function hashCompanyEmailDomain(domain: string): string {
  return createHash("sha256").update(domain.trim().toLowerCase(), "utf8").digest("hex");
}

export function generateCompanyEmailCode(now = Date.now()): {
  code: string;
  salt: string;
  codeHash: string;
  expiresAt: Date;
} {
  const code = String(randomInt(0, 1_000_000)).padStart(COMPANY_EMAIL_CODE_LENGTH, "0");
  const salt = randomBytes(16).toString("hex");
  const codeHash = hashCompanyEmailCode(salt, code);
  return {
    code,
    salt,
    codeHash,
    expiresAt: new Date(now + COMPANY_EMAIL_CODE_TTL_MS),
  };
}

export function hashCompanyEmailCode(salt: string, code: string): string {
  return createHash("sha256").update(`${salt}:${code}`, "utf8").digest("hex");
}

export function companyEmailCodesMatch(expectedHash: string, salt: string, code: string): boolean {
  const actual = hashCompanyEmailCode(salt, code);
  try {
    const a = Buffer.from(expectedHash, "utf8");
    const b = Buffer.from(actual, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function companyEmailClaimExpiresAt(verifiedAt: Date): Date {
  return new Date(verifiedAt.getTime() + COMPANY_EMAIL_CLAIM_TTL_MS);
}

export function isCompanyEmailChallengeExpired(expiresAt: string | Date, now = new Date()): boolean {
  const ms = typeof expiresAt === "string" ? Date.parse(expiresAt) : expiresAt.getTime();
  if (!Number.isFinite(ms)) return true;
  return ms <= now.getTime();
}

export function isCompanyEmailClaimActive(input: {
  status: string;
  expires_at: string | null;
  now?: Date;
}): boolean {
  if (input.status !== "verified") return false;
  if (!input.expires_at) return true;
  return !isCompanyEmailChallengeExpired(input.expires_at, input.now ?? new Date());
}

export type CompanyEmailPublicStatus = {
  claim_active: boolean;
  verified_at: string | null;
  expires_at: string | null;
  pending_challenge: boolean;
  challenge_expires_at: string | null;
  attempts_remaining: number | null;
};

export function publicCompanyEmailStatus(input: {
  claim: { status: string; verified_at: string | null; expires_at: string | null } | null;
  challenge: {
    expires_at: string;
    attempt_count: number;
    max_attempts: number;
    consumed_at: string | null;
  } | null;
  now?: Date;
}): CompanyEmailPublicStatus {
  const now = input.now ?? new Date();
  const claimActive = input.claim
    ? isCompanyEmailClaimActive({
        status: input.claim.status,
        expires_at: input.claim.expires_at,
        now,
      })
    : false;

  const challenge =
    input.challenge &&
    !input.challenge.consumed_at &&
    !isCompanyEmailChallengeExpired(input.challenge.expires_at, now)
      ? input.challenge
      : null;

  const attemptsRemaining = challenge
    ? Math.max(0, challenge.max_attempts - challenge.attempt_count)
    : null;

  return {
    claim_active: claimActive,
    verified_at: claimActive ? input.claim?.verified_at ?? null : null,
    expires_at: claimActive ? input.claim?.expires_at ?? null : null,
    pending_challenge: Boolean(challenge) && (attemptsRemaining ?? 0) > 0,
    challenge_expires_at: challenge?.expires_at ?? null,
    attempts_remaining: attemptsRemaining,
  };
}

/** Strip accidental email/code fields from any API-shaped object (tests + defense). */
export function sanitizeCompanyEmailResponse<T extends Record<string, unknown>>(body: T): T {
  const blocked = new Set([
    "email",
    "work_email",
    "code",
    "otp",
    "email_hash",
    "code_hash",
    "code_salt",
    "domain",
  ]);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (blocked.has(key)) continue;
    out[key] = value;
  }
  return out as T;
}

export function companyEmailValidationMessage(error: CompanyEmailValidationErr["error"]): string {
  switch (error) {
    case "free_mail_domain":
      return "Use a current work email. Free personal email domains are not accepted.";
    case "too_long":
      return "That email address is too long.";
    default:
      return "Enter a valid work email address.";
  }
}
