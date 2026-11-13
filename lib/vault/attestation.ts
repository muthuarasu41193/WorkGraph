/**
 * Contributor firsthand attestation for Interview Vault publishes.
 * Legal wording below is placeholder and MUST be reviewed by counsel before production use.
 */

export const VAULT_ATTESTATION_VERSION = "2026-11-13-placeholder";

/**
 * NEEDS COUNSEL REVIEW — placeholder contributor attestation.
 * Do not treat this as reviewed legal language.
 */
export const VAULT_ATTESTATION_COPY = [
  "NEEDS COUNSEL REVIEW: I confirm this guide is my original, firsthand interview experience (or I have permission from the person who had it).",
  "NEEDS COUNSEL REVIEW: I have not copied content from LinkedIn, Reddit, Blind, LeetCode Discuss, Glassdoor, GitHub, or other third-party platforms.",
  "NEEDS COUNSEL REVIEW: This guide does not include confidential employer materials, full offer letters, credentials I am not allowed to share, or personal details of other people.",
  "NEEDS COUNSEL REVIEW: I understand false or harmful content may be removed and my account may be restricted.",
] as const;

export const VAULT_CONTRIBUTOR_GUIDANCE = [
  "Write about interviews you personally attended. Do not invent rounds or outcomes.",
  "Do not paste confidential take-homes, NDAs, or other people’s names, emails, or phone numbers.",
  "Do not scrape or republish posts from LinkedIn, Reddit, X, GitHub, or similar platforms — link to the original source instead if you want to cite it.",
  "Outcomes you enter are self-reported estimates of what happened, not proof of hiring decisions.",
] as const;

export function isCurrentAttestationVersion(version: string | null | undefined): boolean {
  return version === VAULT_ATTESTATION_VERSION;
}

export function requireAttestationForPublish(input: {
  attestationAccepted: boolean;
  attestationVersion?: string | null;
}): { ok: true; version: string } | { ok: false; error: string } {
  if (!input.attestationAccepted) {
    return {
      ok: false,
      error: "Accept the contributor attestation before publishing.",
    };
  }
  const version = input.attestationVersion?.trim() || VAULT_ATTESTATION_VERSION;
  if (!isCurrentAttestationVersion(version)) {
    return {
      ok: false,
      error: "Accept the current contributor attestation before publishing.",
    };
  }
  return { ok: true, version };
}
