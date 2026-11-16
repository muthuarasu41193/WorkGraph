/**
 * Interview Vault evidence labels — single source of truth.
 *
 * Labels are independent claims shown together, not a tier or score.
 * Clients never set or upgrade labels; derivation is server-side only.
 * Do not use the word "verified" unqualified in buyer-facing copy.
 */

export const VAULT_EVIDENCE_CLAIM_TYPES = [
  "current_company_email",
  "past_employment_reviewed",
  "interview_evidence_reviewed",
] as const;

export type VaultEvidenceClaimType = (typeof VAULT_EVIDENCE_CLAIM_TYPES)[number];

export const VAULT_EVIDENCE_LABEL_IDS = [
  ...VAULT_EVIDENCE_CLAIM_TYPES,
  "outcome_self_reported",
  "not_independently_verified",
] as const;

export type VaultEvidenceLabelId = (typeof VAULT_EVIDENCE_LABEL_IDS)[number];

export const VAULT_VERIFICATION_STATUSES = ["pending", "verified", "rejected", "revoked"] as const;
export type VaultVerificationStatus = (typeof VAULT_VERIFICATION_STATUSES)[number];

/** Allowed method codes stored without PII or evidence contents. */
export const VAULT_VERIFICATION_METHODS = [
  "company_email_challenge",
  "manual_review",
  "authorized_provider",
] as const;

export type VaultVerificationMethod = (typeof VAULT_VERIFICATION_METHODS)[number];

export type VaultEvidenceLabelDefinition = {
  id: VaultEvidenceLabelId;
  /** Short buyer-facing chip text. Never unqualified "verified". */
  buyerText: string;
  means: string;
  doesNotMean: string;
};

/**
 * Canonical definitions. Stable ids must not be renamed without a migration plan.
 * Legal/policy framing marked for counsel where it describes product promises.
 */
export const VAULT_EVIDENCE_LABEL_DEFINITIONS: Record<
  VaultEvidenceLabelId,
  VaultEvidenceLabelDefinition
> = {
  current_company_email: {
    id: "current_company_email",
    buyerText: "Current company email confirmed",
    means:
      "The contributor demonstrated access to a supported company email at the time shown on the label record.",
    doesNotMean:
      "This does not establish past employment, interview participation, or that the guide is accurate. It also does not name which employer and does not imply a match to the company in the guide.",
  },
  past_employment_reviewed: {
    id: "past_employment_reviewed",
    buyerText: "Past employment reviewed",
    means:
      "A reviewer checked limited evidence, or an authorized provider confirmed employment history. Availability varies.",
    doesNotMean:
      "This does not prove every detail in the guide, guarantee accuracy, or rule out incomplete or outdated history.",
  },
  interview_evidence_reviewed: {
    id: "interview_evidence_reviewed",
    buyerText: "Interview evidence reviewed",
    means: "A reviewer checked redacted evidence that an interview took place.",
    doesNotMean:
      "This does not prove every detail in the guide, guarantee accuracy, or lead to a job offer.",
  },
  outcome_self_reported: {
    id: "outcome_self_reported",
    buyerText: "Outcome self-reported",
    means: "The contributor selected an interview outcome themselves.",
    doesNotMean: "This outcome is not independently confirmed.",
  },
  not_independently_verified: {
    id: "not_independently_verified",
    buyerText: "Not independently verified",
    means:
      "None of the independently reviewed evidence claims apply to this guide. The guide can still be published under existing seller rules.",
    doesNotMean:
      "This does not mean the guide is false, and it does not add a ranking penalty beyond showing this label truthfully.",
  },
};

/** NEEDS COUNSEL REVIEW — buyer explainer framing. */
export const VAULT_EVIDENCE_LABELS_DISCLAIMER =
  "These labels do not guarantee accuracy, rule out fraud, or lead to a job offer. They describe limited evidence checks when available. NEEDS COUNSEL REVIEW.";

export type VaultEvidenceLabelPublic = {
  id: VaultEvidenceLabelId;
  text: string;
};

/** Stored verification row fields used for derivation (never returned publicly). */
export type ContributorVerificationRecord = {
  contributor_id: string;
  experience_id: string | null;
  claim_type: string;
  status: string;
  method: string | null;
  verified_at: string | null;
  expires_at: string | null;
};

export function isVaultEvidenceClaimType(value: string): value is VaultEvidenceClaimType {
  return (VAULT_EVIDENCE_CLAIM_TYPES as readonly string[]).includes(value);
}

export function isVaultVerificationStatus(value: string): value is VaultVerificationStatus {
  return (VAULT_VERIFICATION_STATUSES as readonly string[]).includes(value);
}

export function isVaultVerificationMethod(value: string): value is VaultVerificationMethod {
  return (VAULT_VERIFICATION_METHODS as readonly string[]).includes(value);
}

function isExpired(expiresAt: string | null | undefined, now: Date): boolean {
  if (!expiresAt) return false;
  const expires = Date.parse(expiresAt);
  if (!Number.isFinite(expires)) return true;
  return expires <= now.getTime();
}

function claimAppliesToGuide(
  record: ContributorVerificationRecord,
  guide: { id: string; seller_id: string },
): boolean {
  if (record.contributor_id !== guide.seller_id) return false;
  if (record.experience_id == null || record.experience_id === "") return true;
  return record.experience_id === guide.id;
}

/**
 * Derive buyer-facing labels from stored verification records and guide outcome.
 * Expired or non-verified claims do not count. Absence of the first three claims
 * yields not_independently_verified. Clients cannot supply or upgrade labels.
 */
export function deriveGuideEvidenceLabels(input: {
  guide: { id: string; seller_id: string; result: string | null };
  records: readonly ContributorVerificationRecord[];
  now?: Date;
}): VaultEvidenceLabelPublic[] {
  const now = input.now ?? new Date();
  const activeClaims = new Set<VaultEvidenceClaimType>();

  for (const record of input.records) {
    if (!claimAppliesToGuide(record, input.guide)) continue;
    if (record.status !== "verified") continue;
    if (isExpired(record.expires_at, now)) continue;
    if (!isVaultEvidenceClaimType(record.claim_type)) continue;
    activeClaims.add(record.claim_type);
  }

  const labels: VaultEvidenceLabelPublic[] = [];

  for (const claim of VAULT_EVIDENCE_CLAIM_TYPES) {
    if (!activeClaims.has(claim)) continue;
    const def = VAULT_EVIDENCE_LABEL_DEFINITIONS[claim];
    labels.push({ id: def.id, text: def.buyerText });
  }

  if (input.guide.result) {
    const def = VAULT_EVIDENCE_LABEL_DEFINITIONS.outcome_self_reported;
    labels.push({ id: def.id, text: def.buyerText });
  }

  if (activeClaims.size === 0) {
    const def = VAULT_EVIDENCE_LABEL_DEFINITIONS.not_independently_verified;
    labels.push({ id: def.id, text: def.buyerText });
  }

  return labels;
}

/** Strip any accidental private verification fields from a public payload. */
export function publicEvidenceLabelsOnly(
  labels: readonly VaultEvidenceLabelPublic[],
): VaultEvidenceLabelPublic[] {
  return labels.map((label) => ({
    id: label.id,
    text: label.text,
  }));
}

export function mapContributorVerificationRow(
  row: Record<string, unknown>,
): ContributorVerificationRecord {
  return {
    contributor_id: String(row.contributor_id ?? ""),
    experience_id: row.experience_id != null ? String(row.experience_id) : null,
    claim_type: String(row.claim_type ?? ""),
    status: String(row.status ?? ""),
    method: row.method != null ? String(row.method) : null,
    verified_at: row.verified_at != null ? String(row.verified_at) : null,
    expires_at: row.expires_at != null ? String(row.expires_at) : null,
  };
}
