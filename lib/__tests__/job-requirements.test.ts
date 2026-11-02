import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { extractJobRequirements, jobRequirementTexts } from "../job-requirements.ts";

describe("extractJobRequirements", () => {
  it("pulls required skills and qualifications without inventing", () => {
    const text = `
Backend Engineer
Requirements:
- Python
- PostgreSQL
Preferred:
- Kubernetes
Qualifications:
- 5+ years building APIs
`;
    const reqs = extractJobRequirements(text, { title: "Backend Engineer", company: "Acme" });
    const labels = jobRequirementTexts(reqs).map((s) => s.toLowerCase());
    assert.ok(labels.some((s) => s.includes("python")));
    assert.ok(labels.some((s) => s.includes("kubernetes") || s.includes("postgresql") || s.includes("apis")));
    assert.ok(reqs.every((r) => r.text.length > 0));
  });
});
