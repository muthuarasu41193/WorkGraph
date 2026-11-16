/**
 * Server-only company-email confirmation: challenge lifecycle + durable claims.
 * Writes use the service-role client; clients cannot upgrade verification status.
 */

import {
  COMPANY_EMAIL_CODE_TTL_MS,
  COMPANY_EMAIL_MAX_ATTEMPTS,
  COMPANY_EMAIL_RATE_LIMIT_ADDRESS,
  COMPANY_EMAIL_RATE_LIMIT_DOMAIN,
  COMPANY_EMAIL_RATE_LIMIT_USER,
  COMPANY_EMAIL_RATE_WINDOW_MS,
  companyEmailClaimExpiresAt,
  companyEmailCodesMatch,
  companyEmailValidationMessage,
  generateCompanyEmailCode,
  hashCompanyEmail,
  hashCompanyEmailDomain,
  isCompanyEmailChallengeExpired,
  publicCompanyEmailStatus,
  sanitizeCompanyEmailResponse,
  validateCompanyEmailCodeInput,
  validateCompanyEmailInput,
  type CompanyEmailPublicStatus,
} from "@/lib/vault-company-email";
import {
  buildCompanyEmailConfirmationEmail,
  sendWorkgraphEmail,
} from "@/lib/email/workgraph-mail";
import { checkRateLimit } from "@/lib/hidden-opportunities/rate-limit";
import { logRouteError } from "@/lib/security/log";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const CLAIM_TYPE = "current_company_email" as const;
const METHOD = "company_email_challenge" as const;

export class CompanyEmailApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

type ChallengeRow = {
  id: string;
  contributor_id: string;
  email_hash: string;
  code_salt: string;
  code_hash: string;
  expires_at: string;
  attempt_count: number;
  max_attempts: number;
  consumed_at: string | null;
};

type ClaimRow = {
  id: string;
  contributor_id: string;
  claim_type: string;
  status: string;
  method: string | null;
  verified_at: string | null;
  expires_at: string | null;
};

function requireAdmin() {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new CompanyEmailApiError("Supabase is not configured", 503);
  return admin;
}

function enforceRateLimits(userId: string, email: string, domain: string): void {
  const window = { limit: COMPANY_EMAIL_RATE_LIMIT_USER, windowMs: COMPANY_EMAIL_RATE_WINDOW_MS };
  const user = checkRateLimit(`vault-company-email:user:${userId}`, window);
  if (!user.allowed) {
    throw new CompanyEmailApiError(`Too many requests. Try again in ${user.retryAfterSec}s.`, 429);
  }

  const addr = checkRateLimit(`vault-company-email:addr:${hashCompanyEmail(email)}`, {
    limit: COMPANY_EMAIL_RATE_LIMIT_ADDRESS,
    windowMs: COMPANY_EMAIL_RATE_WINDOW_MS,
  });
  if (!addr.allowed) {
    throw new CompanyEmailApiError(
      `Too many requests for this address. Try again in ${addr.retryAfterSec}s.`,
      429,
    );
  }

  const dom = checkRateLimit(`vault-company-email:domain:${hashCompanyEmailDomain(domain)}`, {
    limit: COMPANY_EMAIL_RATE_LIMIT_DOMAIN,
    windowMs: COMPANY_EMAIL_RATE_WINDOW_MS,
  });
  if (!dom.allowed) {
    throw new CompanyEmailApiError(
      `Too many requests for this domain. Try again in ${dom.retryAfterSec}s.`,
      429,
    );
  }
}

async function loadOwnClaim(contributorId: string): Promise<ClaimRow | null> {
  const admin = requireAdmin();
  const { data, error } = await admin
    .from("contributor_verifications")
    .select("id,contributor_id,claim_type,status,method,verified_at,expires_at")
    .eq("contributor_id", contributorId)
    .eq("claim_type", CLAIM_TYPE)
    .is("experience_id", null)
    .maybeSingle();

  if (error) {
    logRouteError("vault/company-email/claim", error);
    throw new CompanyEmailApiError("Could not load confirmation status", 500);
  }
  return (data as ClaimRow | null) ?? null;
}

async function loadActiveChallenge(contributorId: string): Promise<ChallengeRow | null> {
  const admin = requireAdmin();
  const { data, error } = await admin
    .from("contributor_company_email_challenges")
    .select(
      "id,contributor_id,email_hash,code_salt,code_hash,expires_at,attempt_count,max_attempts,consumed_at",
    )
    .eq("contributor_id", contributorId)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logRouteError("vault/company-email/challenge", error);
    throw new CompanyEmailApiError("Could not load confirmation status", 500);
  }
  return (data as ChallengeRow | null) ?? null;
}

async function writeAudit(input: {
  contributorId: string;
  actorId: string;
  verificationId: string | null;
  action: "created" | "status_changed" | "expired" | "revoked";
  outcome: "pending" | "verified" | "rejected" | "revoked";
}): Promise<void> {
  const admin = requireAdmin();
  const { error } = await admin.from("contributor_verification_audit").insert({
    contributor_id: input.contributorId,
    actor_id: input.actorId,
    verification_id: input.verificationId,
    claim_type: CLAIM_TYPE,
    action: input.action,
    outcome: input.outcome,
  });
  if (error) {
    // Audit failure must not leak into client; claim write already succeeded or failed separately.
    logRouteError("vault/company-email/audit", error);
  }
}

async function invalidateChallenges(contributorId: string): Promise<void> {
  const admin = requireAdmin();
  const { error } = await admin
    .from("contributor_company_email_challenges")
    .delete()
    .eq("contributor_id", contributorId);
  if (error) {
    logRouteError("vault/company-email/invalidate", error);
    throw new CompanyEmailApiError("Could not reset confirmation challenge", 500);
  }
}

export async function getCompanyEmailStatus(contributorId: string): Promise<CompanyEmailPublicStatus> {
  const [claim, challenge] = await Promise.all([
    loadOwnClaim(contributorId),
    loadActiveChallenge(contributorId),
  ]);
  return publicCompanyEmailStatus({ claim, challenge });
}

export async function startCompanyEmailChallenge(
  contributorId: string,
  rawEmail: unknown,
): Promise<Record<string, unknown>> {
  const validated = validateCompanyEmailInput(rawEmail);
  if (!validated.ok) {
    throw new CompanyEmailApiError(companyEmailValidationMessage(validated.error), 400);
  }

  enforceRateLimits(contributorId, validated.email, validated.domain);

  const generated = generateCompanyEmailCode();
  const emailHash = hashCompanyEmail(validated.email);

  await invalidateChallenges(contributorId);

  const admin = requireAdmin();
  const { error: insertError } = await admin.from("contributor_company_email_challenges").insert({
    contributor_id: contributorId,
    email_hash: emailHash,
    code_salt: generated.salt,
    code_hash: generated.codeHash,
    expires_at: generated.expiresAt.toISOString(),
    attempt_count: 0,
    max_attempts: COMPANY_EMAIL_MAX_ATTEMPTS,
  });

  if (insertError) {
    logRouteError("vault/company-email/start-insert", insertError);
    throw new CompanyEmailApiError("Could not start confirmation", 500);
  }

  const mail = buildCompanyEmailConfirmationEmail({
    to: validated.email,
    code: generated.code,
    expiresInMinutes: Math.max(1, Math.round(COMPANY_EMAIL_CODE_TTL_MS / 60_000)),
  });

  const sendResult = await sendWorkgraphEmail(mail);
  if (!sendResult.ok) {
    await invalidateChallenges(contributorId);
    logRouteError("vault/company-email/send", new Error("send_failed"));
    throw new CompanyEmailApiError("Could not send confirmation email. Try again later.", 502);
  }

  return sanitizeCompanyEmailResponse({
    ok: true,
    step: "enter_code",
    challenge_expires_at: generated.expiresAt.toISOString(),
    attempts_remaining: COMPANY_EMAIL_MAX_ATTEMPTS,
    message: "We sent a one-time code to that work email. Enter it below.",
  });
}

export async function confirmCompanyEmailChallenge(
  contributorId: string,
  rawEmail: unknown,
  rawCode: unknown,
): Promise<Record<string, unknown>> {
  const validated = validateCompanyEmailInput(rawEmail);
  if (!validated.ok) {
    throw new CompanyEmailApiError(companyEmailValidationMessage(validated.error), 400);
  }
  const codeParsed = validateCompanyEmailCodeInput(rawCode);
  if (!codeParsed.ok) {
    throw new CompanyEmailApiError("Enter the 6-digit code from your email.", 400);
  }

  const challenge = await loadActiveChallenge(contributorId);
  if (!challenge) {
    throw new CompanyEmailApiError("No active confirmation challenge. Request a new code.", 400);
  }

  if (isCompanyEmailChallengeExpired(challenge.expires_at)) {
    await invalidateChallenges(contributorId);
    return sanitizeCompanyEmailResponse({
      ok: false,
      step: "expired",
      error: "That code has expired. Request a new one.",
    });
  }

  if (challenge.attempt_count >= challenge.max_attempts) {
    await invalidateChallenges(contributorId);
    return sanitizeCompanyEmailResponse({
      ok: false,
      step: "too_many_attempts",
      error: "Too many incorrect attempts. Request a new code.",
    });
  }

  const emailHash = hashCompanyEmail(validated.email);
  if (emailHash !== challenge.email_hash) {
    // Do not reveal whether the address mismatches the pending challenge.
    const admin = requireAdmin();
    await admin
      .from("contributor_company_email_challenges")
      .update({ attempt_count: challenge.attempt_count + 1 })
      .eq("id", challenge.id)
      .eq("contributor_id", contributorId);

    const remaining = Math.max(0, challenge.max_attempts - (challenge.attempt_count + 1));
    if (remaining === 0) {
      await invalidateChallenges(contributorId);
      return sanitizeCompanyEmailResponse({
        ok: false,
        step: "too_many_attempts",
        error: "Too many incorrect attempts. Request a new code.",
      });
    }
    return sanitizeCompanyEmailResponse({
      ok: false,
      step: "enter_code",
      error: "That code did not match. Try again.",
      attempts_remaining: remaining,
    });
  }

  if (!companyEmailCodesMatch(challenge.code_hash, challenge.code_salt, codeParsed.code)) {
    const admin = requireAdmin();
    const nextAttempts = challenge.attempt_count + 1;
    await admin
      .from("contributor_company_email_challenges")
      .update({ attempt_count: nextAttempts })
      .eq("id", challenge.id)
      .eq("contributor_id", contributorId);

    const remaining = Math.max(0, challenge.max_attempts - nextAttempts);
    if (remaining === 0) {
      await invalidateChallenges(contributorId);
      return sanitizeCompanyEmailResponse({
        ok: false,
        step: "too_many_attempts",
        error: "Too many incorrect attempts. Request a new code.",
      });
    }
    return sanitizeCompanyEmailResponse({
      ok: false,
      step: "enter_code",
      error: "That code did not match. Try again.",
      attempts_remaining: remaining,
    });
  }

  const verifiedAt = new Date();
  const expiresAt = companyEmailClaimExpiresAt(verifiedAt);
  const admin = requireAdmin();

  // Mark challenge consumed then delete so plaintext never persists and hashes are gone.
  await admin
    .from("contributor_company_email_challenges")
    .update({ consumed_at: verifiedAt.toISOString() })
    .eq("id", challenge.id)
    .eq("contributor_id", contributorId);

  await invalidateChallenges(contributorId);

  const existing = await loadOwnClaim(contributorId);
  let verificationId: string;

  if (existing) {
    const { data, error } = await admin
      .from("contributor_verifications")
      .update({
        status: "verified",
        method: METHOD,
        verified_at: verifiedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq("id", existing.id)
      .eq("contributor_id", contributorId)
      .select("id")
      .single();

    if (error || !data) {
      logRouteError("vault/company-email/confirm-update", error ?? new Error("missing"));
      throw new CompanyEmailApiError("Could not save confirmation", 500);
    }
    verificationId = (data as { id: string }).id;
    await writeAudit({
      contributorId,
      actorId: contributorId,
      verificationId,
      action: "status_changed",
      outcome: "verified",
    });
  } else {
    const { data, error } = await admin
      .from("contributor_verifications")
      .insert({
        contributor_id: contributorId,
        experience_id: null,
        claim_type: CLAIM_TYPE,
        status: "verified",
        method: METHOD,
        verified_at: verifiedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (error || !data) {
      logRouteError("vault/company-email/confirm-insert", error ?? new Error("missing"));
      throw new CompanyEmailApiError("Could not save confirmation", 500);
    }
    verificationId = (data as { id: string }).id;
    await writeAudit({
      contributorId,
      actorId: contributorId,
      verificationId,
      action: "created",
      outcome: "verified",
    });
  }

  return sanitizeCompanyEmailResponse({
    ok: true,
    step: "success",
    verified_at: verifiedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    message:
      "Current company email confirmed. Buyers may see the label “Current company email confirmed” until it expires. Your email address is not stored.",
  });
}

export async function withdrawCompanyEmailClaim(contributorId: string): Promise<Record<string, unknown>> {
  const existing = await loadOwnClaim(contributorId);
  if (!existing || existing.status !== "verified") {
    throw new CompanyEmailApiError("No active company-email confirmation to withdraw.", 400);
  }

  const admin = requireAdmin();
  const { error } = await admin
    .from("contributor_verifications")
    .update({
      status: "revoked",
      verified_at: null,
      expires_at: null,
    })
    .eq("id", existing.id)
    .eq("contributor_id", contributorId);

  if (error) {
    logRouteError("vault/company-email/withdraw", error);
    throw new CompanyEmailApiError("Could not withdraw confirmation", 500);
  }

  await invalidateChallenges(contributorId);
  await writeAudit({
    contributorId,
    actorId: contributorId,
    verificationId: existing.id,
    action: "revoked",
    outcome: "revoked",
  });

  return sanitizeCompanyEmailResponse({
    ok: true,
    step: "enter_email",
    message: "Company-email confirmation withdrawn. Guides show “Not independently verified” unless another claim applies.",
  });
}
