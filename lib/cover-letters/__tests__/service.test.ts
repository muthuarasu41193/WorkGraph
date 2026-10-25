import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COVER_LETTER_SYSTEM_PROMPT,
  COVER_LETTER_REVISION_TEMPERATURE,
  COVER_LETTER_TEMPERATURE,
  generateCoverLetter,
  type CoverLetterCompletion,
} from "../service";

const PARAMS = {
  jobTitle: "Software Engineer",
  company: "Acme Corp",
  jobDescription: "Build APIs for a team of 8.",
  resumeText: "UNIQUE_RESUME_MARKER. Software engineer at Acme Corp. Increased revenue by 12%.",
};

describe("cover letter prompt", () => {
  it("keeps temperature at or below 0.4 and states the evidence rules", () => {
    assert.ok(COVER_LETTER_TEMPERATURE <= 0.4);
    assert.ok(COVER_LETTER_REVISION_TEMPERATURE <= 0.4);
    assert.match(COVER_LETTER_SYSTEM_PROMPT, /Use ONLY facts present in the candidate's resume text/);
    assert.match(
      COVER_LETTER_SYSTEM_PROMPT,
      /Never invent employers, titles, dates, metrics, skills, certifications or achievements/,
    );
    assert.match(COVER_LETTER_SYSTEM_PROMPT, /do not claim it/);
    assert.match(COVER_LETTER_SYSTEM_PROMPT, /at most one sentence of genuine interest/);
    assert.match(
      COVER_LETTER_SYSTEM_PROMPT,
      /NEVER invent, fabricate, or suggest adding experience the candidate does not have/,
    );
    assert.doesNotMatch(COVER_LETTER_SYSTEM_PROMPT, /STRICT JSON/);
  });
});

describe("generateCoverLetter", () => {
  it("returns a grounded letter without a second call", async () => {
    const calls: Array<{ temperature: number; roles: string[] }> = [];
    const complete: CoverLetterCompletion = async (input) => {
      calls.push({
        temperature: input.temperature,
        roles: input.messages.map((message) => message.role),
      });
      assert.equal(input.messages[0]?.role, "system");
      assert.equal(input.messages[0]?.content.includes("UNIQUE_RESUME_MARKER"), false);
      assert.match(input.messages[1]?.content ?? "", /UNIQUE_RESUME_MARKER/);
      assert.ok(input.temperature <= 0.4);
      return "I was a software engineer at Acme Corp and increased revenue by 12%.";
    };

    const result = await generateCoverLetter(PARAMS, complete);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0]?.roles, ["system", "user"]);
    assert.equal(result.warnings.length, 0);
    assert.match(result.letter, /Acme Corp/);
  });

  it("regenerates once when a draft invents 45%, then returns a clean letter", async () => {
    const temperatures: number[] = [];
    let attempt = 0;
    const complete: CoverLetterCompletion = async (input) => {
      temperatures.push(input.temperature);
      attempt += 1;
      if (attempt === 1) return "I increased revenue by 45% at Initech Labs.";
      assert.match(input.messages[1]?.content ?? "", /45%/);
      assert.match(input.messages[1]?.content ?? "", /UNIQUE_RESUME_MARKER/);
      return "I was a software engineer at Acme Corp and increased revenue by 12%.";
    };

    const result = await generateCoverLetter(PARAMS, complete);
    assert.deepEqual(temperatures, [0.4, 0.2]);
    assert.equal(result.warnings.length, 0);
    assert.match(result.letter, /12%/);
  });

  it("returns the revised letter with a visible warning when flags remain", async () => {
    let attempt = 0;
    const complete: CoverLetterCompletion = async () => {
      attempt += 1;
      return attempt === 1
        ? "I increased revenue by 45%."
        : "I increased revenue by 45% at Initech Labs.";
    };

    const result = await generateCoverLetter(PARAMS, complete);
    assert.equal(attempt, 2);
    assert.equal(result.warnings.length, 1);
    assert.match(result.warnings[0] ?? "", /^Check these claims before sending: /);
    assert.match(result.warnings[0] ?? "", /45%/);
    assert.match(result.warnings[0] ?? "", /Initech Labs/);
    assert.match(result.letter, /Initech Labs/);
  });

  it("rejects a missing resume before calling the model", async () => {
    let called = false;
    const complete: CoverLetterCompletion = async () => {
      called = true;
      return "letter";
    };
    await assert.rejects(
      () =>
        generateCoverLetter(
          { ...PARAMS, resumeText: "   " },
          complete,
        ),
      /candidate background/,
    );
    assert.equal(called, false);
  });

  it("hides provider errors and does not echo secrets", async () => {
    await assert.rejects(
      () =>
        generateCoverLetter(PARAMS, async () => {
          throw new Error("Missing required environment variable: GROQ_API_KEY");
        }),
      /not configured on this server/,
    );

    await assert.rejects(
      () =>
        generateCoverLetter(PARAMS, async () => {
          throw new Error("secret token abc");
        }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /Cover letter generation failed/);
        assert.equal(error.message.includes("secret"), false);
        return true;
      },
    );
  });
});
