import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { composePrepPack, toShareablePack, validateComposeInput } from "../compose.ts";
import { matchVaultGuides } from "../match-guides.ts";
import { vaultFreshnessLabel } from "../freshness.ts";
import type { VaultExperienceListItem } from "../../vault.ts";

function guide(partial: Partial<VaultExperienceListItem> & Pick<VaultExperienceListItem, "id" | "company" | "role">): VaultExperienceListItem {
  return {
    seller_id: "seller",
    level: null,
    difficulty: "medium",
    rounds: 3,
    result: "offer",
    interview_date: "2026-09-01",
    price_inr: 0,
    view_count: 1,
    sales_count: 0,
    avg_rating: 4.5,
    published_at: "2026-09-10T00:00:00.000Z",
    preview: "Preview of the interview rounds and questions…",
    questions_html: "",
    tips_html: "",
    rounds_data: [],
    trust_statuses: ["outcome_self_reported", "not_independently_verified"],
    display_name: null,
    contents_outline: ["Phone screen", "Onsite", "Questions asked"],
    freshness_label: "Interview reported within 180 days",
    ...partial,
  };
}

describe("validateComposeInput", () => {
  it("requires exactly one of JD or role template", () => {
    assert.match(validateComposeInput({}) ?? "", /either/);
    assert.match(
      validateComposeInput({ jobDescription: "x".repeat(50), roleTemplateId: "software-engineer" }) ?? "",
      /either/,
    );
  });

  it("rejects short job descriptions", () => {
    assert.match(validateComposeInput({ jobDescription: "too short" }) ?? "", /longer/);
  });
});

describe("composePrepPack from job description", () => {
  it("extracts requirements, matches guides, and labels sources", () => {
    const jd = [
      "Senior Software Engineer at Acme",
      "",
      "Requirements: React, TypeScript, system design",
      "Preferred: Kubernetes",
      "Responsibilities:",
      "- Build APIs",
      "- Mentor engineers",
    ].join("\n");

    const pack = composePrepPack(
      { jobDescription: jd },
      [
        guide({ id: "g1", company: "Acme", role: "Software Engineer" }),
        guide({ id: "g2", company: "OtherCo", role: "Designer" }),
      ],
      Date.parse("2026-11-12T00:00:00.000Z"),
    );

    assert.equal(pack.input_mode, "job_description");
    assert.equal(pack.company, "Acme");
    assert.ok(pack.requirements.some((s) => /react/i.test(s.name)));
    assert.ok(pack.requirements.every((s) => s.source === "job_description"));
    assert.equal(pack.guides[0]?.id, "g1");
    assert.equal(pack.guides[0]?.source, "firsthand_guide");
    assert.ok(pack.checklist.length >= 4);
    assert.ok(pack.disclaimers.some((d) => /not a hiring probability/i.test(d)));
  });

  it("share projection omits share_id and keeps labeled fields", () => {
    const pack = composePrepPack(
      { roleTemplateId: "frontend-engineer" },
      [guide({ id: "g1", company: "Acme", role: "Frontend Engineer" })],
    );
    pack.share_id = "abc";
    const shared = toShareablePack(pack);
    assert.equal("share_id" in shared, false);
    assert.equal(shared.role_template_id, "frontend-engineer");
    assert.ok(shared.requirements.every((s) => s.source === "role_template"));
  });
});

describe("matchVaultGuides", () => {
  it("ranks company matches above unrelated guides", () => {
    const matches = matchVaultGuides({
      guides: [
        guide({ id: "a", company: "Acme", role: "Engineer" }),
        guide({ id: "b", company: "Zed", role: "Sales" }),
      ],
      searchTerms: ["engineer", "react"],
      companyHint: "Acme",
    });
    assert.equal(matches[0]?.id, "a");
    assert.match(matches[0]?.match_reason ?? "", /company/i);
  });
});

describe("vaultFreshnessLabel", () => {
  it("labels recent interview dates", () => {
    const label = vaultFreshnessLabel("2026-10-01", "2026-10-02T00:00:00.000Z", Date.parse("2026-11-12T00:00:00.000Z"));
    assert.match(label, /within/i);
  });
});
