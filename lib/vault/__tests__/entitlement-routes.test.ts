import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { matchPrepPackGuides } from "../../prep-pack/match-guides.ts";
import { getPrepRoleById } from "../../prep-pack/roles.ts";
import type { PrepPackGuideCandidate } from "../../prep-pack/types.ts";
import { hasVaultEntitlement } from "../../security/vault-entitlement.ts";
import { publicVaultListItem, redactVaultExperience, type VaultExperience } from "../../vault.ts";
import { assertNoLockedVaultFields, projectPublicVaultGuide } from "../public-guide.ts";

const OWNER = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";

function paidExperience(): VaultExperience {
  return {
    id: "exp-1",
    seller_id: OWNER,
    company: "Acme",
    role: "Frontend Engineer",
    level: "L4",
    difficulty: "medium",
    rounds: 3,
    result: "offer",
    interview_date: "2026-01-01",
    interview_round: "System design",
    skills: ["React", "TypeScript"],
    rounds_data: [{ name: "Phone", description: "SECRET_PROMPT_DO_NOT_LEAK" }],
    questions_html: "<p>SECRET_QUESTION</p>",
    tips_html: "<p>SECRET_TIP</p>",
    price_inr: 499,
    status: "published",
    draft_step: 5,
    view_count: 10,
    sales_count: 2,
    avg_rating: 4.5,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
    published_at: "2026-01-02T00:00:00.000Z",
    content_confirmed_at: "2026-06-01T00:00:00.000Z",
    attestation_accepted_at: "2026-01-02T00:00:00.000Z",
    attestation_version: "2026-11-13-placeholder",
    removed_at: null,
  };
}

describe("Milestone B entitlement protection on touched projections", () => {
  it("marketplace list items never include locked body fields", () => {
    const listed = publicVaultListItem(paidExperience());
    assert.equal(listed.questions_html, "");
    assert.equal(listed.tips_html, "");
    assert.deepEqual(listed.rounds_data, []);
    assertNoLockedVaultFields({
      ...listed,
      questions_html: listed.questions_html,
      tips_html: listed.tips_html,
      rounds_data: listed.rounds_data,
    });
  });

  it("redacted detail payloads stay locked for non-purchasers", () => {
    const exp = paidExperience();
    assert.equal(
      hasVaultEntitlement({
        viewerId: OTHER,
        sellerId: exp.seller_id,
        priceInr: exp.price_inr,
        purchase: { payment_status: "pending" },
      }),
      false,
    );
    const redacted = redactVaultExperience(exp);
    assert.equal(redacted.questions_html, "");
    assert.equal(redacted.tips_html, "");
    assert.deepEqual(redacted.rounds_data, []);
    assert.equal(redacted.questions_html.includes("SECRET"), false);
  });

  it("prep-pack public guide projection omits locked content and removed guides", () => {
    const exp = paidExperience();
    const projection = projectPublicVaultGuide({
      id: exp.id,
      company: exp.company,
      role: exp.role,
      level: exp.level,
      interview_round: exp.interview_round,
      skills: exp.skills,
      difficulty: exp.difficulty,
      rounds: exp.rounds,
      avg_rating: exp.avg_rating,
      price_inr: exp.price_inr,
      content_confirmed_at: exp.content_confirmed_at,
      updated_at: exp.updated_at,
      published_at: exp.published_at,
      roundNames: exp.rounds_data.map((r) => r.name),
    });
    assert.ok(projection);
    assert.equal("questions_html" in projection, false);
    assert.equal("tips_html" in projection, false);
    assert.equal("rounds_data" in projection, false);
    assert.deepEqual(projection.roundNames, ["Phone"]);
    assert.match(projection.last_confirmed_label, /Last confirmed/i);

    const removed = projectPublicVaultGuide({
      id: exp.id,
      company: exp.company,
      role: exp.role,
      removed_at: "2026-11-01T00:00:00.000Z",
    });
    assert.equal(removed, null);
  });

  it("prep-pack matching route output never returns paid body fields", () => {
    const candidate: PrepPackGuideCandidate = {
      id: "exp-1",
      company: "Acme",
      role: "Frontend Engineer",
      level: "L4",
      difficulty: "medium",
      rounds: 3,
      avg_rating: 4.5,
      price_inr: 499,
      skills: ["React"],
      interview_round: "System design",
      content_confirmed_at: "2026-06-01T00:00:00.000Z",
      updated_at: "2026-06-01T00:00:00.000Z",
      published_at: "2026-01-02T00:00:00.000Z",
      stale: false,
      last_confirmed_label: "Last confirmed 1 Jun 2026",
      stale_label: null,
      roundNames: ["Phone"],
    };
    const role = getPrepRoleById("frontend-engineer");
    assert.ok(role);
    const matched = matchPrepPackGuides({
      guides: [candidate],
      skills: [{ name: "React", source: "job_description" }],
      role,
    });
    assert.ok(matched.length >= 1);
    for (const guide of matched) {
      assertNoLockedVaultFields(guide);
      assert.equal("questions_html" in guide, false);
      assert.equal("tips_html" in guide, false);
      assert.equal("rounds_data" in guide, false);
      assert.ok(guide.last_confirmed_label);
    }
  });
});
