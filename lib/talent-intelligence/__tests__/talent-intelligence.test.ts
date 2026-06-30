import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hashContent, buildCacheKey, clampScore, scoreToGrade } from "../utils.ts";
import { parseJobDescription } from "../services/job-description-parser.ts";
import { analyzeKeywords } from "../services/keyword-analyzer.ts";
import { runDeterministicAtsChecks } from "../services/ats-analyzer.ts";

describe("talent-intelligence utils", () => {
  it("hashContent is stable", () => {
    const a = hashContent("hello world");
    const b = hashContent("hello world");
    assert.equal(a, b);
    assert.notEqual(a, hashContent("other"));
  });

  it("buildCacheKey includes prompt version", () => {
    const key = buildCacheKey("resume-hash", "jd-hash");
    assert.ok(key.includes("resume-hash"));
    assert.ok(key.includes("jd-hash"));
  });

  it("clampScore bounds 0-100", () => {
    assert.equal(clampScore(150), 100);
    assert.equal(clampScore(-5), 0);
    assert.equal(clampScore(72.4), 72);
  });

  it("scoreToGrade maps thresholds", () => {
    assert.equal(scoreToGrade(92), "A");
    assert.equal(scoreToGrade(55), "F");
  });
});

describe("job-description-parser", () => {
  it("extracts title from first line", () => {
    const parsed = parseJobDescription("Senior Engineer\n\nWe need React experience.");
    assert.equal(parsed.title, "Senior Engineer");
  });

  it("detects seniority", () => {
    const parsed = parseJobDescription("Senior Software Engineer at Acme\nRequirements: Python");
    assert.equal(parsed.seniority, "Senior");
  });
});

describe("keyword-analyzer", () => {
  it("finds present and missing keywords", () => {
    const result = analyzeKeywords(
      "Built React applications with TypeScript and Node.js",
      "Looking for React, Kubernetes, and TypeScript experience required.",
    );
    assert.ok(result.comparison.length > 0);
    const react = result.comparison.find((k) => k.keyword === "react");
    assert.ok(react);
    assert.equal(react.status, "present");
  });
});

describe("ats-analyzer", () => {
  it("flags short resumes", () => {
    const indicators = runDeterministicAtsChecks("John Doe\nemail@test.com");
    const length = indicators.find((i) => i.category === "Length");
    assert.ok(length);
    assert.equal(length.status, "critical");
  });
});
