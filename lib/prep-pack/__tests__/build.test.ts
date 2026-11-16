import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildPrepPack, PREP_PACK_ESTIMATE_NOTICE } from "../build.ts";
import { buildPrepPackChecklist } from "../checklist.ts";
import { extractPrepPackSkills } from "../extract.ts";
import { matchPrepPackGuides, PREP_PACK_GUIDE_LIMIT } from "../match-guides.ts";
import { getPrepRoleById, inferPrepRoleFromText } from "../roles.ts";
import type { PrepPackGuideCandidate } from "../types.ts";

function guide(partial: Partial<PrepPackGuideCandidate> & Pick<PrepPackGuideCandidate, "id" | "role">): PrepPackGuideCandidate {
  return {
    company: "Acme",
    level: null,
    difficulty: "medium",
    rounds: 3,
    avg_rating: 4.5,
    price_inr: 499,
    roundNames: ["Phone screen", "Coding", "Hiring manager"],
    interview_round: "Phone screen",
    skills: [],
    content_confirmed_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
    published_at: "2026-01-02T00:00:00.000Z",
    stale: false,
    last_confirmed_label: "Last confirmed 1 Jun 2026",
    stale_label: null,
    ...partial,
  };
}

describe("extractPrepPackSkills", () => {
  it("extracts taxonomy skills from a job description", () => {
    const { skills, role } = extractPrepPackSkills({
      jobDescription:
        "We need a backend engineer with Python, PostgreSQL, Docker, and Kubernetes experience for APIs.",
    });
    assert.ok(skills.some((s) => s.name.toLowerCase() === "python" && s.source === "job_description"));
    // PostgreSQL aliases collapse to the sql bucket in lib/job-match SKILL_ALIASES.
    assert.ok(skills.some((s) => /sql/i.test(s.name) && s.source === "job_description"));
    assert.ok(skills.some((s) => /docker/i.test(s.name) && s.source === "job_description"));
    assert.equal(role?.id, "backend-engineer");
  });

  it("adds role focus skills when only a role is selected", () => {
    const { skills, role } = extractPrepPackSkills({ roleId: "frontend-engineer" });
    assert.equal(role?.id, "frontend-engineer");
    assert.ok(skills.length > 0);
    assert.ok(skills.every((s) => s.source === "role_focus"));
    assert.ok(skills.some((s) => /react/i.test(s.name)));
  });

  it("ignores empty input", () => {
    const { skills, role } = extractPrepPackSkills({ jobDescription: "   ", roleId: "" });
    assert.equal(skills.length, 0);
    assert.equal(role, null);
  });
});

describe("inferPrepRoleFromText / getPrepRoleById", () => {
  it("resolves curated roles", () => {
    assert.equal(getPrepRoleById("product-manager")?.label, "Product manager");
    assert.equal(getPrepRoleById("nope"), null);
    assert.equal(inferPrepRoleFromText("Hiring a product manager for growth")?.id, "product-manager");
  });
});

describe("matchPrepPackGuides", () => {
  it("ranks guides by role and skill overlap and explains why", () => {
    const guides = [
      guide({ id: "11111111-1111-4111-8111-111111111111", role: "Frontend Engineer", company: "North" }),
      guide({ id: "22222222-2222-4222-8222-222222222222", role: "Sales AE", company: "South" }),
      guide({
        id: "33333333-3333-4333-8333-333333333333",
        role: "React Developer",
        company: "West",
        roundNames: [],
      }),
    ];
    const role = getPrepRoleById("frontend-engineer");
    assert.ok(role);
    const matched = matchPrepPackGuides({
      guides,
      skills: [
        { name: "React", source: "job_description" },
        { name: "TypeScript", source: "role_focus" },
      ],
      role,
    });
    assert.ok(matched.length >= 1);
    assert.ok(matched.length <= PREP_PACK_GUIDE_LIMIT);
    assert.equal(matched[0]?.href, `/interview-vault/${matched[0]?.id}`);
    assert.ok(matched[0]?.why.some((w) => /role|skills/i.test(w)));
    assert.equal(
      matched.some((g) => g.role === "Sales AE"),
      false,
    );
  });

  it("returns empty when nothing scores", () => {
    const matched = matchPrepPackGuides({
      guides: [guide({ id: "11111111-1111-4111-8111-111111111111", role: "Chef" })],
      skills: [{ name: "Kubernetes", source: "job_description" }],
      role: getPrepRoleById("frontend-engineer"),
    });
    assert.deepEqual(matched, []);
  });
});

describe("buildPrepPackChecklist", () => {
  it("prefers round names from matched guides", () => {
    const role = getPrepRoleById("software-engineer");
    assert.ok(role);
    const items = buildPrepPackChecklist({
      role,
      skills: [{ name: "Python", source: "job_description" }],
      matchedGuides: [
        guide({
          id: "11111111-1111-4111-8111-111111111111",
          role: "Software Engineer",
          roundNames: ["System design deep dive"],
        }),
      ],
    });
    assert.ok(items.some((item) => item.round === "System design deep dive"));
    assert.ok(items.every((item) => item.text.length > 0 && item.id.length > 0));
  });

  it("falls back to role default rounds", () => {
    const role = getPrepRoleById("designer");
    assert.ok(role);
    const items = buildPrepPackChecklist({
      role,
      skills: [],
      matchedGuides: [],
    });
    assert.ok(items.some((item) => item.round === "Portfolio review"));
  });
});

describe("buildPrepPack", () => {
  it("builds an ok pack with estimate notice", () => {
    const pack = buildPrepPack({
      roleId: "backend-engineer",
      jobDescription: "Looking for Python and SQL. Docker is a plus.",
      guides: [
        guide({
          id: "11111111-1111-4111-8111-111111111111",
          role: "Backend Engineer",
          company: "River",
        }),
      ],
    });
    assert.equal(pack.status, "ok");
    assert.equal(pack.estimateNotice, PREP_PACK_ESTIMATE_NOTICE);
    assert.ok(pack.guides.length >= 1);
    assert.ok(pack.checklist.length >= 1);
    assert.ok(pack.skills.some((s) => /python/i.test(s.name)));
  });

  it("marks no_matches when guides do not score", () => {
    const pack = buildPrepPack({
      roleId: "sales",
      guides: [guide({ id: "11111111-1111-4111-8111-111111111111", role: "Platform SRE" })],
    });
    assert.equal(pack.status, "no_matches");
    assert.equal(pack.guides.length, 0);
    assert.ok(pack.checklist.length >= 1);
  });
});
