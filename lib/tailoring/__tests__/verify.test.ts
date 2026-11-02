import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ZodError } from "zod";

import { buildSourceLines, sourceLineMap } from "../source.ts";
import {
  parseTailoringModelJson,
  reasonSuggestionFails,
  tryParseTailoringModelJson,
  verifyTailoringResponse,
} from "../verify.ts";

const resume = [
  "Senior Engineer at Acme Corp, 2020-2024.",
  "Built billing APIs in Python that processed 2M requests per day.",
  "Led a team of 4 engineers on payments reliability.",
].join("\n");

function ctx(skills: string[] = ["Python", "SQL"]) {
  const source = buildSourceLines(resume);
  return { source, sourceById: sourceLineMap(source), profileSkills: skills };
}

describe("tailoring source lines", () => {
  it("numbers lines L1.. after normalising whitespace", () => {
    const doc = buildSourceLines("  Hello   world  \n\n\nSecond line\n");
    assert.equal(doc.lines.length, 2);
    assert.equal(doc.lines[0]?.id, "L1");
    assert.equal(doc.lines[0]?.text, "Hello world");
    assert.equal(doc.lines[1]?.id, "L2");
  });
});

describe("tailoring verifier", () => {
  it("rejects an invented number not present on the source line", () => {
    const { sourceById, profileSkills } = ctx();
    const reason = reasonSuggestionFails(
      {
        sourceId: "L2",
        rewrite: "Built billing APIs in Python that processed 10M requests per day.",
        jobRequirement: "scale",
      },
      { sourceById, profileSkills },
    );
    assert.equal(reason, "invented_number");
  });

  it("rejects an invented tool / proper noun not on the source line or skills", () => {
    const { sourceById, profileSkills } = ctx(["Python"]);
    const reason = reasonSuggestionFails(
      {
        sourceId: "L2",
        rewrite: "Built billing APIs in Python and Kubernetes that processed 2M requests per day.",
        jobRequirement: "platform",
      },
      { sourceById, profileSkills },
    );
    assert.equal(reason, "invented_token");
  });

  it("rejects an unknown sourceId", () => {
    const { sourceById, profileSkills } = ctx();
    const reason = reasonSuggestionFails(
      {
        sourceId: "L99",
        rewrite: "Built billing APIs in Python that processed 2M requests per day.",
        jobRequirement: "APIs",
      },
      { sourceById, profileSkills },
    );
    assert.equal(reason, "unknown_source");
  });

  it("accepts a faithful rephrase using only source-line facts", () => {
    const { sourceById, profileSkills } = ctx();
    const suggestion = {
      sourceId: "L2",
      rewrite: "Processed 2M requests per day with billing APIs built in Python.",
      jobRequirement: "API scale",
    };
    assert.equal(reasonSuggestionFails(suggestion, { sourceById, profileSkills }), null);

    const verified = verifyTailoringResponse(
      {
        suggestions: [suggestion],
        gaps: [{ requirement: "Kubernetes", tip: "Add only if true: mention cluster work." }],
      },
      { sourceById, profileSkills },
    );
    assert.equal(verified.suggestions.length, 1);
    assert.equal(verified.rejectedCount, 0);
    assert.match(verified.suggestions[0]?.sourceText ?? "", /billing APIs/);
    assert.match(verified.gaps[0]?.tip ?? "", /^Add only if true:/i);
  });

  it("Zod rejects extra keys on the model payload", () => {
    const result = tryParseTailoringModelJson({
      suggestions: [
        {
          sourceId: "L1",
          rewrite: "Senior Engineer at Acme Corp, 2020-2024.",
          jobRequirement: "experience",
          invented: true,
        },
      ],
      gaps: [],
    });
    assert.equal(result.ok, false);
    if (result.ok) throw new Error("expected failure");
    assert.ok(result.error instanceof ZodError);

    assert.throws(
      () =>
        parseTailoringModelJson({
          suggestions: [],
          gaps: [],
          extraTopLevel: "nope",
        }),
      ZodError,
    );
  });

  it("drops rejected suggestions while keeping valid gaps", () => {
    const { sourceById, profileSkills } = ctx();
    const verified = verifyTailoringResponse(
      {
        suggestions: [
          {
            sourceId: "L2",
            rewrite: "Built billing APIs in Rust that processed 2M requests per day.",
            jobRequirement: "APIs",
          },
          {
            sourceId: "L3",
            rewrite: "Led a team of 4 engineers focused on payments reliability.",
            jobRequirement: "leadership",
          },
        ],
        gaps: [{ requirement: "GraphQL", tip: "mention GraphQL experience" }],
      },
      { sourceById, profileSkills },
    );
    assert.equal(verified.suggestions.length, 1);
    assert.equal(verified.suggestions[0]?.sourceId, "L3");
    assert.equal(verified.rejectedCount, 1);
    assert.equal(verified.gaps.length, 1);
  });
});
