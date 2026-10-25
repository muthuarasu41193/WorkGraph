import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PROFILE_MATCH_MIN_PERCENT, scoreJobCard } from "../job-match";
import { jobCardView } from "../job-feed";
import type { RecommendedJobCard } from "../job-dashboard";
import {
  COMMON_NON_TECH_SKILLS,
  MISSING_SKILLS_DETAIL_LIMIT,
  MISSING_SKILLS_LIMIT,
  TAILOR_PLACEHOLDER_HREF,
  attachMissingSkills,
  extractJobSkills,
  missingSkills,
  profileHasResume,
  tailorLinkHref,
} from "../job-requirements";

const NOW = Date.parse("2026-10-23T12:00:00.000Z");

function card(partial: Partial<RecommendedJobCard> & Pick<RecommendedJobCard, "id">): RecommendedJobCard {
  return {
    title: "Role",
    company: "Acme",
    location: "Remote",
    description: "",
    source: "greenhouse",
    matchLabel: "40% match · react",
    postedAgo: "Today",
    postedAtIso: null,
    kind: "listing",
    classification: "employer_hiring",
    isCommunity: false,
    matchedSkills: [],
    ...partial,
  };
}

describe("extractJobSkills", () => {
  it("returns canonical names once, in posting order, without treating javascript as java", () => {
    assert.deepEqual(
      extractJobSkills("Kubernetes Engineer", "We need SQL before React."),
      ["kubernetes", "sql", "react"],
    );
    assert.deepEqual(extractJobSkills("", "We use javascript daily."), ["javascript"]);
    assert.deepEqual(extractJobSkills("Engineer", "Strong java skills, plus javascript."), ["java", "javascript"]);
    assert.deepEqual(
      extractJobSkills("JavaScript Developer", "Experience with Node.js, nodejs, and React."),
      ["javascript", "react"],
    );
  });

  it("finds curated non-tech skills and ignores non-text input", () => {
    assert.ok(COMMON_NON_TECH_SKILLS.includes("stakeholder management"));
    assert.ok(COMMON_NON_TECH_SKILLS.includes("financial modeling"));
    assert.deepEqual(
      extractJobSkills("Analyst", "Stakeholder management and FINANCIAL MODELING are required."),
      ["stakeholder management", "financial modeling"],
    );
    assert.deepEqual(extractJobSkills(undefined as unknown as string, null as unknown as string), []);
    const late = `${"word ".repeat(20_000)}react`;
    assert.equal(late.length > 50_000, true);
    assert.deepEqual(extractJobSkills("", late), []);
    assert.deepEqual(extractJobSkills("", `sql ${"word ".repeat(100)}`), ["sql"]);
  });
});

describe("missingSkills", () => {
  it("treats Node.js and nodejs as the same skill", () => {
    assert.deepEqual(missingSkills(["javascript"], ["nodejs"]), []);
    assert.deepEqual(missingSkills(["javascript"], ["Node.js"]), []);
    assert.deepEqual(missingSkills(["Node.js"], ["nodejs"]), []);
    assert.deepEqual(missingSkills(["python"], ["Django"]), []);
  });

  it("drops duplicates and keeps the first five in appearance order", () => {
    const found = extractJobSkills(
      "",
      "SQL, Kubernetes, Docker, React, Python, and Figma are all required.",
    );
    assert.deepEqual(found, ["sql", "kubernetes", "docker", "react", "python", "figma"]);
    assert.deepEqual(missingSkills(found, ["React"]), ["sql", "kubernetes", "docker", "python", "figma"]);
    assert.equal(missingSkills(found, ["Excel"]).length, MISSING_SKILLS_LIMIT);
    assert.deepEqual(missingSkills(found, ["Excel"]), ["sql", "kubernetes", "docker", "react", "python"]);
    assert.equal(missingSkills(found, ["Excel"], MISSING_SKILLS_DETAIL_LIMIT).length, 6);
    assert.deepEqual(missingSkills(["javascript", "JavaScript", "javascript", "  "], ["python"]), ["javascript"]);
  });

  it("returns no list when the profile has no skills", () => {
    assert.deepEqual(missingSkills(["javascript", "sql"], []), []);
    assert.deepEqual(missingSkills(["javascript", "sql"], ["", "   "]), []);
    assert.deepEqual(missingSkills("javascript" as unknown as string[], ["python"]), []);
  });
});

describe("score stays independent of missing skills", () => {
  it("does not change match percent, rank inputs, or the 40% floor", () => {
    const job = {
      title: "Senior Technical Recruiter",
      description: "Full-cycle technical recruiting and Node.js.",
      postedAtIso: new Date(NOW - 2 * 86_400_000).toISOString(),
    };
    const profile = {
      skills: ["Technical recruiting", "Sourcing", "Node.js"],
      headline: "Technical Recruiter",
      summary: "Recruiting for engineering teams.",
    };
    const scored = scoreJobCard(job, profile, NOW);
    assert.equal(PROFILE_MATCH_MIN_PERCENT, 40);
    assert.equal(scored.missingSkills, undefined);
    const again = scoreJobCard(job, profile, NOW);
    assert.equal(again.matchPercent, scored.matchPercent);
    assert.equal(again.score, scored.score);
    assert.deepEqual(again.subScores, scored.subScores);
    assert.deepEqual(again.matchedSkills, scored.matchedSkills);
    const annotated = attachMissingSkills(
      { title: job.title, description: job.description },
      profile.skills,
    );
    assert.deepEqual(annotated.missingSkills, []);
    assert.equal(scored.matchPercent, again.matchPercent);
  });
});

describe("jobCardView requirements", () => {
  it("marks matched skills met and missing skills not met", () => {
    const view = jobCardView(
      card({
        id: "mix",
        matchedSkills: ["react"],
        missingSkills: ["kubernetes", "sql"],
      }),
    );
    assert.deepEqual(view.match.requirements, [
      { label: "react", met: true },
      { label: "kubernetes", met: false },
      { label: "sql", met: false },
    ]);
  });
});

describe("tailor link", () => {
  it("hides the link when there is no resume", () => {
    assert.equal(profileHasResume(null), false);
    assert.equal(profileHasResume({ resume_raw_text: "short", resume_url: null }), false);
    assert.equal(tailorLinkHref({ hasResume: false, entitlement: "ok" }), null);
    assert.equal(tailorLinkHref({ hasResume: false, entitlement: "limit_reached" }), null);
  });

  it("hides the link when the session cannot use tailoring", () => {
    assert.equal(tailorLinkHref({ hasResume: true, entitlement: "anonymous" }), null);
    assert.equal(tailorLinkHref({ hasResume: true, entitlement: "unavailable" }), null);
  });

  it("sends a free user at the limit to pricing and keeps a placeholder otherwise", () => {
    assert.equal(profileHasResume({ resume_raw_text: "x".repeat(120), resume_url: null }), true);
    assert.equal(tailorLinkHref({ hasResume: true, entitlement: "limit_reached" }), "/pricing");
    assert.equal(tailorLinkHref({ hasResume: true, entitlement: "ok" }), TAILOR_PLACEHOLDER_HREF);
  });
});
