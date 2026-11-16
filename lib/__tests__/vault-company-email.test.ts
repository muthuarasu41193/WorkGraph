import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it, beforeEach } from "node:test";
import { fileURLToPath } from "node:url";

import { clearRateLimitBuckets, checkRateLimit } from "../hidden-opportunities/rate-limit.ts";
import { deriveGuideEvidenceLabels } from "../vault-evidence-labels.ts";
import {
  COMPANY_EMAIL_CODE_TTL_MS,
  COMPANY_EMAIL_MAX_ATTEMPTS,
  COMPANY_EMAIL_RATE_LIMIT_ADDRESS,
  COMPANY_EMAIL_RATE_LIMIT_DOMAIN,
  COMPANY_EMAIL_RATE_LIMIT_USER,
  COMPANY_EMAIL_RATE_WINDOW_MS,
  companyEmailClaimExpiresAt,
  companyEmailCodesMatch,
  generateCompanyEmailCode,
  hashCompanyEmail,
  hashCompanyEmailCode,
  hashCompanyEmailDomain,
  isCompanyEmailChallengeExpired,
  isCompanyEmailClaimActive,
  publicCompanyEmailStatus,
  sanitizeCompanyEmailResponse,
  validateCompanyEmailCodeInput,
  validateCompanyEmailInput,
} from "../vault-company-email.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const OWNER = "11111111-1111-4111-8111-111111111111";
const GUIDE_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

describe("company email validation", () => {
  it("accepts a work email and rejects free-mail domains", () => {
    const ok = validateCompanyEmailInput("Alex.P@Acme-Corp.io");
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.equal(ok.email, "alex.p@acme-corp.io");
      assert.equal(ok.domain, "acme-corp.io");
    }

    const free = validateCompanyEmailInput("person@gmail.com");
    assert.equal(free.ok, false);
    if (!free.ok) assert.equal(free.error, "free_mail_domain");

    assert.equal(validateCompanyEmailInput("not-an-email").ok, false);
    assert.equal(validateCompanyEmailInput("a".repeat(300) + "@x.com").ok, false);
  });

  it("validates six-digit codes only", () => {
    assert.deepEqual(validateCompanyEmailCodeInput("123456"), { ok: true, code: "123456" });
    assert.equal(validateCompanyEmailCodeInput("12345").ok, false);
    assert.equal(validateCompanyEmailCodeInput("1234567").ok, false);
    assert.equal(validateCompanyEmailCodeInput("12 34 56").ok, true);
  });
});

describe("company email code hashing and expiry", () => {
  it("hashes codes with salt and compares in constant-time style", () => {
    const generated = generateCompanyEmailCode(Date.parse("2026-11-13T12:00:00.000Z"));
    assert.equal(generated.code.length, 6);
    assert.equal(generated.codeHash, hashCompanyEmailCode(generated.salt, generated.code));
    assert.equal(companyEmailCodesMatch(generated.codeHash, generated.salt, generated.code), true);
    assert.equal(companyEmailCodesMatch(generated.codeHash, generated.salt, "000000"), false);
    assert.equal(
      generated.expiresAt.getTime(),
      Date.parse("2026-11-13T12:00:00.000Z") + COMPANY_EMAIL_CODE_TTL_MS,
    );
  });

  it("treats challenge expiry correctly", () => {
    const now = new Date("2026-11-13T12:10:00.000Z");
    assert.equal(isCompanyEmailChallengeExpired("2026-11-13T12:09:59.000Z", now), true);
    assert.equal(isCompanyEmailChallengeExpired("2026-11-13T12:10:01.000Z", now), false);
    assert.equal(isCompanyEmailChallengeExpired("not-a-date", now), true);
  });

  it("sets claim expiry ~12 months from verification", () => {
    const verifiedAt = new Date("2026-11-13T00:00:00.000Z");
    const expires = companyEmailClaimExpiresAt(verifiedAt);
    assert.ok(expires.getTime() > verifiedAt.getTime());
    assert.equal(isCompanyEmailClaimActive({ status: "verified", expires_at: expires.toISOString(), now: verifiedAt }), true);
    assert.equal(
      isCompanyEmailClaimActive({
        status: "verified",
        expires_at: expires.toISOString(),
        now: new Date(expires.getTime() + 1),
      }),
      false,
    );
    assert.equal(isCompanyEmailClaimActive({ status: "revoked", expires_at: null }), false);
  });
});

describe("company email attempt and rate limits", () => {
  beforeEach(() => {
    clearRateLimitBuckets();
  });

  it("rate-limits by user, address hash, and domain hash keys", () => {
    const email = "dev@examplecorp.com";
    const userKey = `vault-company-email:user:${OWNER}`;
    const addrKey = `vault-company-email:addr:${hashCompanyEmail(email)}`;
    const domainKey = `vault-company-email:domain:${hashCompanyEmailDomain("examplecorp.com")}`;

    for (let i = 0; i < COMPANY_EMAIL_RATE_LIMIT_USER; i += 1) {
      assert.equal(
        checkRateLimit(userKey, {
          limit: COMPANY_EMAIL_RATE_LIMIT_USER,
          windowMs: COMPANY_EMAIL_RATE_WINDOW_MS,
        }).allowed,
        true,
      );
    }
    assert.equal(
      checkRateLimit(userKey, {
        limit: COMPANY_EMAIL_RATE_LIMIT_USER,
        windowMs: COMPANY_EMAIL_RATE_WINDOW_MS,
      }).allowed,
      false,
    );

    clearRateLimitBuckets();
    for (let i = 0; i < COMPANY_EMAIL_RATE_LIMIT_ADDRESS; i += 1) {
      assert.equal(
        checkRateLimit(addrKey, {
          limit: COMPANY_EMAIL_RATE_LIMIT_ADDRESS,
          windowMs: COMPANY_EMAIL_RATE_WINDOW_MS,
        }).allowed,
        true,
      );
    }
    assert.equal(
      checkRateLimit(addrKey, {
        limit: COMPANY_EMAIL_RATE_LIMIT_ADDRESS,
        windowMs: COMPANY_EMAIL_RATE_WINDOW_MS,
      }).allowed,
      false,
    );

    clearRateLimitBuckets();
    for (let i = 0; i < COMPANY_EMAIL_RATE_LIMIT_DOMAIN; i += 1) {
      assert.equal(
        checkRateLimit(domainKey, {
          limit: COMPANY_EMAIL_RATE_LIMIT_DOMAIN,
          windowMs: COMPANY_EMAIL_RATE_WINDOW_MS,
        }).allowed,
        true,
      );
    }
    assert.equal(
      checkRateLimit(domainKey, {
        limit: COMPANY_EMAIL_RATE_LIMIT_DOMAIN,
        windowMs: COMPANY_EMAIL_RATE_WINDOW_MS,
      }).allowed,
      false,
    );
  });

  it("exposes attempts remaining and locks out at max attempts", () => {
    const challenge = {
      expires_at: "2026-11-13T13:00:00.000Z",
      attempt_count: COMPANY_EMAIL_MAX_ATTEMPTS,
      max_attempts: COMPANY_EMAIL_MAX_ATTEMPTS,
      consumed_at: null,
    };
    const status = publicCompanyEmailStatus({
      claim: null,
      challenge,
      now: new Date("2026-11-13T12:00:00.000Z"),
    });
    assert.equal(status.pending_challenge, false);
    assert.equal(status.attempts_remaining, 0);
  });
});

describe("company email privacy sanitization", () => {
  it("strips email, code, hashes, and domain from response payloads", () => {
    const cleaned = sanitizeCompanyEmailResponse({
      ok: true,
      step: "success",
      email: "secret@corp.com",
      code: "123456",
      email_hash: "abc",
      code_hash: "def",
      code_salt: "ghi",
      domain: "corp.com",
      message: "done",
    });
    assert.equal("email" in cleaned, false);
    assert.equal("code" in cleaned, false);
    assert.equal("email_hash" in cleaned, false);
    assert.equal("code_hash" in cleaned, false);
    assert.equal("domain" in cleaned, false);
    assert.equal(cleaned.message, "done");
  });

  it("public status never includes email fields", () => {
    const status = publicCompanyEmailStatus({
      claim: {
        status: "verified",
        verified_at: "2026-11-01T00:00:00.000Z",
        expires_at: "2027-11-01T00:00:00.000Z",
      },
      challenge: null,
      now: new Date("2026-11-13T12:00:00.000Z"),
    });
    assert.equal(status.claim_active, true);
    assert.equal("email" in status, false);
    assert.equal("domain" in status, false);
  });
});

describe("company email label derivation (V1)", () => {
  it("shows current company email confirmed and drops not independently verified", () => {
    const labels = deriveGuideEvidenceLabels({
      guide: { id: GUIDE_ID, seller_id: OWNER, result: null },
      records: [
        {
          contributor_id: OWNER,
          experience_id: null,
          claim_type: "current_company_email",
          status: "verified",
          method: "company_email_challenge",
          verified_at: "2026-11-01T00:00:00.000Z",
          expires_at: "2027-11-01T00:00:00.000Z",
        },
      ],
      now: new Date("2026-11-13T12:00:00.000Z"),
    });
    assert.deepEqual(
      labels.map((l) => l.id),
      ["current_company_email"],
    );
    assert.equal(labels[0]?.text, "Current company email confirmed");
  });

  it("hides the label after expires_at", () => {
    const labels = deriveGuideEvidenceLabels({
      guide: { id: GUIDE_ID, seller_id: OWNER, result: null },
      records: [
        {
          contributor_id: OWNER,
          experience_id: null,
          claim_type: "current_company_email",
          status: "verified",
          method: "company_email_challenge",
          verified_at: "2025-01-01T00:00:00.000Z",
          expires_at: "2026-01-01T00:00:00.000Z",
        },
      ],
      now: new Date("2026-11-13T12:00:00.000Z"),
    });
    assert.deepEqual(
      labels.map((l) => l.id),
      ["not_independently_verified"],
    );
  });
});

describe("company email migration RLS and privacy", () => {
  it("adds challenge table with select-own only and no authenticated writes", () => {
    const migrationsDir = join(root, "supabase/migrations");
    const file = readdirSync(migrationsDir)
      .filter((name) => name.includes("vault_company_email"))
      .sort()
      .at(-1);
    assert.ok(file, "expected company email migration");
    const sql = readFileSync(join(migrationsDir, file!), "utf8");

    assert.match(sql, /create table if not exists public\.contributor_company_email_challenges/);
    assert.match(sql, /enable row level security/);
    assert.match(sql, /company_email_challenges_select_own/);
    assert.match(sql, /email_hash/);
    assert.match(sql, /code_hash/);
    assert.doesNotMatch(sql, /for insert/i);
    assert.doesNotMatch(sql, /for update/i);
    assert.doesNotMatch(sql, /for delete/i);
    assert.doesNotMatch(sql, /create policy[\s\S]*for insert/i);
    assert.match(sql, /never plaintext/i);
  });

  it("route module requires session and does not echo email or code", () => {
    const route = readFileSync(join(root, "app/api/vault/company-email/route.ts"), "utf8");
    assert.match(route, /getSessionUser/);
    assert.match(route, /sanitizeCompanyEmailResponse/);
    assert.match(route, /action === "start"/);
    assert.match(route, /action === "confirm"/);
    assert.match(route, /action === "withdraw"/);
  });

  it("server module deletes challenges after success and never logs email/code", () => {
    const server = readFileSync(join(root, "lib/vault-company-email-server.ts"), "utf8");
    assert.match(server, /invalidateChallenges/);
    assert.match(server, /company_email_challenge/);
    assert.match(server, /current_company_email/);
    assert.doesNotMatch(server, /console\.(log|info|debug|warn|error)\([^)]*email/);
    assert.doesNotMatch(server, /console\.(log|info|debug|warn|error)\([^)]*code/);
    assert.doesNotMatch(server, /logRouteError\([^)]*validated\.email/);
  });
});
