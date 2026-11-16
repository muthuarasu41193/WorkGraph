import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  deriveGuideEvidenceLabels,
  publicEvidenceLabelsOnly,
  VAULT_EVIDENCE_LABEL_DEFINITIONS,
  VAULT_EVIDENCE_LABEL_IDS,
  type ContributorVerificationRecord,
} from "../vault-evidence-labels.ts";
import { publicVaultListItem, redactVaultExperience, type VaultExperience } from "../vault.ts";
import { hasVaultEntitlement } from "../security/vault-entitlement.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const OWNER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const GUIDE_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const NOW = new Date("2026-11-13T12:00:00.000Z");

function guide(overrides: Partial<{ id: string; seller_id: string; result: string | null }> = {}) {
  return {
    id: GUIDE_ID,
    seller_id: OWNER,
    result: null as string | null,
    ...overrides,
  };
}

function record(
  overrides: Partial<ContributorVerificationRecord> & Pick<ContributorVerificationRecord, "claim_type">,
): ContributorVerificationRecord {
  return {
    contributor_id: OWNER,
    experience_id: null,
    status: "verified",
    method: "manual_review",
    verified_at: "2026-10-01T00:00:00.000Z",
    expires_at: null,
    ...overrides,
  };
}

function sampleExperience(overrides: Partial<VaultExperience> = {}): VaultExperience {
  return {
    id: GUIDE_ID,
    seller_id: OWNER,
    company: "Acme",
    role: "Engineer",
    level: "L4",
    difficulty: "medium",
    rounds: 3,
    result: null,
    interview_date: "2026-01-01",
    rounds_data: [{ name: "Phone", description: "Secret" }],
    questions_html: "<p>secret question</p>",
    tips_html: "<p>secret tip</p>",
    price_inr: 499,
    status: "published",
    draft_step: 5,
    view_count: 10,
    sales_count: 2,
    avg_rating: 4.5,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    published_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("vault evidence label definitions", () => {
  it("exposes a stable id set with buyer text and means / does-not-mean copy", () => {
    for (const id of VAULT_EVIDENCE_LABEL_IDS) {
      const def = VAULT_EVIDENCE_LABEL_DEFINITIONS[id];
      assert.equal(def.id, id);
      assert.ok(def.buyerText.length > 0);
      assert.ok(def.means.length > 0);
      assert.ok(def.doesNotMean.length > 0);
      assert.equal(/\bverified\b/i.test(def.buyerText) && !/independently verified/i.test(def.buyerText), false);
    }
    assert.equal(
      VAULT_EVIDENCE_LABEL_DEFINITIONS.not_independently_verified.buyerText,
      "Not independently verified",
    );
    assert.equal(
      VAULT_EVIDENCE_LABEL_DEFINITIONS.current_company_email.buyerText,
      "Current company email confirmed",
    );
  });
});

describe("deriveGuideEvidenceLabels", () => {
  it("defaults existing guides with no records to not_independently_verified", () => {
    const labels = deriveGuideEvidenceLabels({ guide: guide(), records: [], now: NOW });
    assert.deepEqual(labels, [
      { id: "not_independently_verified", text: "Not independently verified" },
    ]);
  });

  it("adds outcome_self_reported when a result is present without independent claims", () => {
    const labels = deriveGuideEvidenceLabels({
      guide: guide({ result: "offer" }),
      records: [],
      now: NOW,
    });
    assert.deepEqual(
      labels.map((l) => l.id),
      ["outcome_self_reported", "not_independently_verified"],
    );
  });

  it("includes active independent claims and omits the default when any apply", () => {
    const labels = deriveGuideEvidenceLabels({
      guide: guide({ result: "rejected" }),
      records: [
        record({ claim_type: "current_company_email", method: "company_email_challenge" }),
        record({
          claim_type: "interview_evidence_reviewed",
          experience_id: GUIDE_ID,
          method: "manual_review",
        }),
      ],
      now: NOW,
    });
    assert.deepEqual(
      labels.map((l) => l.id),
      ["current_company_email", "interview_evidence_reviewed", "outcome_self_reported"],
    );
  });

  it("ignores expired, pending, rejected, and revoked claims", () => {
    const labels = deriveGuideEvidenceLabels({
      guide: guide(),
      records: [
        record({
          claim_type: "past_employment_reviewed",
          expires_at: "2026-01-01T00:00:00.000Z",
        }),
        record({ claim_type: "current_company_email", status: "pending" }),
        record({ claim_type: "interview_evidence_reviewed", status: "rejected", experience_id: GUIDE_ID }),
        record({ claim_type: "past_employment_reviewed", status: "revoked" }),
      ],
      now: NOW,
    });
    assert.deepEqual(labels.map((l) => l.id), ["not_independently_verified"]);
  });

  it("does not apply another contributor's claims or another guide's interview claim", () => {
    const labels = deriveGuideEvidenceLabels({
      guide: guide(),
      records: [
        record({ claim_type: "current_company_email", contributor_id: OTHER }),
        record({
          claim_type: "interview_evidence_reviewed",
          experience_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        }),
      ],
      now: NOW,
    });
    assert.deepEqual(labels.map((l) => l.id), ["not_independently_verified"]);
  });
});

describe("public response shape", () => {
  it("public list items expose labels only and never private verification fields", () => {
    const labels = deriveGuideEvidenceLabels({
      guide: guide({ result: "offer" }),
      records: [record({ claim_type: "past_employment_reviewed" })],
      now: NOW,
    });
    const listed = publicVaultListItem(sampleExperience({ result: "offer" }), labels);
    assert.ok(Array.isArray(listed.evidence_labels));
    assert.equal(listed.questions_html, "");
    assert.equal(listed.tips_html, "");
    assert.deepEqual(listed.rounds_data, []);

    const serialized = JSON.stringify(listed);
    for (const forbidden of [
      "method",
      "verified_at",
      "expires_at",
      "contributor_id",
      "evidence",
      "email",
      "reviewer",
    ]) {
      assert.equal(
        serialized.includes(`"${forbidden}"`),
        false,
        `public list item must not include ${forbidden}`,
      );
    }

    const publicOnly = publicEvidenceLabelsOnly(labels);
    assert.deepEqual(publicOnly, labels.map((l) => ({ id: l.id, text: l.text })));
  });

  it("redaction still strips paid content for locked viewers", () => {
    const redacted = redactVaultExperience(sampleExperience());
    assert.equal(redacted.questions_html, "");
    assert.equal(redacted.tips_html, "");
    assert.deepEqual(redacted.rounds_data, []);
  });
});

describe("entitlement protections unchanged", () => {
  it("pending purchase still does not unlock paid content", () => {
    assert.equal(
      hasVaultEntitlement({
        viewerId: OTHER,
        sellerId: OWNER,
        priceInr: 499,
        purchase: { payment_status: "pending" },
      }),
      false,
    );
    assert.equal(
      hasVaultEntitlement({
        viewerId: OTHER,
        sellerId: OWNER,
        priceInr: 499,
        purchase: { payment_status: "verified" },
      }),
      true,
    );
  });
});

describe("RLS and migration guardrails", () => {
  it("migration grants select-own only and never lets clients insert or upgrade verified status", () => {
    const migrationsDir = join(root, "supabase/migrations");
    const file = readdirSync(migrationsDir)
      .filter((name) => name.includes("vault_evidence_labels"))
      .sort()
      .at(-1);
    assert.ok(file, "expected vault evidence labels migration");
    const sql = readFileSync(join(migrationsDir, file), "utf8");

    assert.match(sql, /contributor_verifications_select_own/);
    assert.match(sql, /auth\.uid\(\)\s*=\s*contributor_id/);
    assert.doesNotMatch(sql, /for insert/i);
    assert.doesNotMatch(sql, /for update/i);
    assert.doesNotMatch(sql, /for delete/i);
    assert.match(sql, /never evidence contents/i);
    assert.match(sql, /no_outcome/);
    assert.match(sql, /prefer_not_to_say/);
  });

  it("server update path does not accept client evidence label or verification status fields", () => {
    const server = readFileSync(join(root, "lib/vault-server.ts"), "utf8");
    assert.match(server, /deriveGuideEvidenceLabels/);
    assert.match(server, /evidence_labels/);
    assert.doesNotMatch(server, /input\.evidence_labels/);
    assert.doesNotMatch(server, /patch\.evidence_labels/);
    assert.doesNotMatch(server, /contributor_verifications[\s\S]{0,200}\.insert/);
    assert.doesNotMatch(server, /contributor_verifications[\s\S]{0,200}\.update/);
  });
});
