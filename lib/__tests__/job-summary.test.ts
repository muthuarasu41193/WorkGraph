import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getApplyLabel } from "../job-apply";
import { buildJobSummary, sanitizeJobDescription } from "../job-summary";
import { matchReason } from "../job-match-reason";

const FIRSTWORK =
  "Tags: Sales Types: Full Time About Firstwork Firstwork exists so that every frontline worker can find a better shift.";

describe("sanitizeJobDescription", () => {
  it("strips Tags, Types, and About {Company} from a real source blurb", () => {
    const cleaned = sanitizeJobDescription(FIRSTWORK, "Firstwork");
    assert.equal(cleaned.includes("Tags:"), false);
    assert.equal(cleaned.includes("Types:"), false);
    assert.equal(cleaned.startsWith("About "), false);
    assert.equal(
      cleaned,
      "Firstwork exists so that every frontline worker can find a better shift.",
    );
  });
});

describe("buildJobSummary", () => {
  it("uses a generated summary and marks it as AI when one exists", () => {
    const summary = buildJobSummary({
      description: FIRSTWORK,
      company: "Firstwork",
      generatedSummary: "AI wrote this shorter pitch for the role.",
    });
    assert.equal(summary?.kind, "ai");
    assert.equal(summary?.text, "AI wrote this shorter pitch for the role.");
  });

  it("falls back to the sanitized description, capped at 160 characters", () => {
    const long = `${FIRSTWORK} ${"word ".repeat(80)}`;
    const summary = buildJobSummary({ description: long, company: "Firstwork" });
    assert.equal(summary?.kind, "excerpt");
    assert.ok(summary);
    assert.ok(summary.text.length <= 160);
    assert.equal(summary.text.includes("Tags:"), false);
  });
});

describe("getApplyLabel", () => {
  it("uses one Apply on {source} pattern", () => {
    assert.equal(getApplyLabel("greenhouse"), "Apply on Greenhouse");
    assert.equal(getApplyLabel("lever", "Acme"), "Apply on Lever");
    assert.equal(getApplyLabel(null, "Firstwork"), "Apply on Firstwork");
  });

  it("does not use Apply Now or Apply on Company Site", () => {
    for (const source of [undefined, null, "", "other", "workgraph", "company", "unknown-board"]) {
      const label = getApplyLabel(source, "Northwind");
      assert.equal(label.includes("Apply Now"), false);
      assert.equal(label.includes("Company Site"), false);
      assert.match(label, /^Apply on /);
    }
  });
});

describe("matchReason", () => {
  it("states how many profile skills overlapped", () => {
    assert.equal(matchReason(4, 9), "Matches 4 of 9 skills");
    assert.equal(matchReason(0, 9), "Matches 0 of 9 skills");
  });
});
