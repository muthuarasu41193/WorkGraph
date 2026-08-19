import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ValidationError } from "../../validation/errors";
import { parseDurationRange } from "../experience";
import { extractResumeTextFromBuffer } from "../extract-text";
import { assertResumeFileBytes } from "../file";
import { extractFromResumeText } from "../heuristic";
import { buildNormalizedResume } from "../pipeline";
import { stripProtectedFields } from "../protected";
import { RESUME_EMBEDDING_DIMENSIONS, RESUME_INTELLIGENCE_SCHEMA_VERSION } from "../schema";
import { normalizeResumeText } from "../text";

const FIXTURE = `
Jane Doe
jane@example.com
Seattle, WA
https://linkedin.com/in/janedoe

Software Engineer

Professional summary
Backend engineer with Python and PostgreSQL. Seeking remote Senior Software Engineer roles.

Skills
Python, PostgreSQL, Docker, leadership

Experience
Senior Software Engineer, Acme Corp
Jan 2020 – Present
Built APIs in Python.

Software Engineer, Beta LLC
2017 – 2019
Wrote SQL reports.

Education
B.S. Computer Science, University of Washington, 2016

Projects
Inventory tracker — Python service for warehouse counts.

Achievements
Reduced API latency.

Certifications
AWS Certified Developer
`.trim();

describe("resume text normalization", () => {
  it("collapses nulls and extra whitespace", () => {
    const normalized = normalizeResumeText("Hello\u0000\n\n\n  world  ");
    assert.equal(normalized.includes("\u0000"), false);
    assert.ok(normalized.startsWith("Hello"));
    assert.ok(normalized.endsWith("world"));
  });
});

describe("secure file validation", () => {
  it("accepts a PDF magic header", () => {
    const buffer = Buffer.from("%PDF-1.7\n% fake pdf body");
    assert.equal(assertResumeFileBytes(buffer, "resume.pdf", "application/pdf"), "pdf");
  });

  it("rejects extension spoofing", () => {
    const buffer = Buffer.from("this is not a pdf");
    assert.throws(() => assertResumeFileBytes(buffer, "resume.pdf", "application/pdf"), ValidationError);
  });

  it("accepts a ZIP/DOCX magic header", () => {
    const buffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
    assert.equal(assertResumeFileBytes(buffer, "resume.docx"), "docx");
  });

  it("rejects empty files", () => {
    assert.throws(() => assertResumeFileBytes(Buffer.alloc(0), "resume.pdf"), ValidationError);
  });
});

describe("heuristic parse", () => {
  it("extracts identity and skills present in the fixture", () => {
    const parsed = extractFromResumeText(FIXTURE);
    assert.equal(parsed.full_name, "Jane Doe");
    assert.equal(parsed.email, "jane@example.com");
    assert.ok(parsed.skills.includes("Python"));
    assert.ok(parsed.skills.includes("PostgreSQL"));
    assert.ok(parsed.projects.length >= 1);
  });
});

describe("normalized pipeline", () => {
  it("builds the internal schema with confidence scores", () => {
    const resume = buildNormalizedResume({ sourceText: FIXTURE });
    assert.equal(resume.schema_version, RESUME_INTELLIGENCE_SCHEMA_VERSION);
    assert.equal(resume.identity.full_name?.value, "Jane Doe");
    assert.ok((resume.identity.full_name?.confidence ?? 0) >= 0.8);

    const python = resume.skills.find((s) => s.skill === "Python");
    assert.ok(python);
    assert.equal(python.confidence, 0.97);
    assert.equal(python.category, "technical");

    const leadership = resume.soft_skills.find((s) => /leadership/i.test(s.skill));
    assert.ok(leadership);

    assert.ok(resume.experience.some((item) => item.company === "Acme Corp"));
    assert.ok(resume.education.some((item) => /Washington/i.test(item.institution)));
    assert.ok(resume.career_timeline.length >= 2);
    assert.ok(resume.years_of_experience && resume.years_of_experience.value >= 5);
    assert.equal(resume.seniority?.value, "Senior");
    assert.equal(resume.employment_preferences.location_mode, "remote");
    assert.ok(resume.quality.estimate_disclaimer.toLowerCase().includes("estimates"));
    assert.ok(resume.embedding);
    assert.equal(resume.embedding?.vector.length, RESUME_EMBEDDING_DIMENSIONS);
  });

  it("does not invent skills that are absent from the resume", () => {
    const resume = buildNormalizedResume({
      sourceText: FIXTURE,
      extracted: {
        skills: ["Python", "Kubernetes"],
        gender: "female",
        age: 29,
        work_experience: [
          { title: "Astronaut", company: "NASA", duration: "2010-2012", description: "Flew to space" },
        ],
      },
    });
    assert.ok(resume.skills.some((s) => s.skill === "Python"));
    assert.equal(resume.skills.some((s) => /kubernetes/i.test(s.skill)), false);
    assert.equal(resume.experience.some((item) => item.company === "NASA"), false);
    assert.equal("gender" in resume.identity, false);
  });

  it("strips protected characteristic keys from model output", () => {
    const cleaned = stripProtectedFields({
      full_name: "Jane Doe",
      gender: "female",
      race: "prefer not to say",
      skills: ["Python"],
    }) as Record<string, unknown>;
    assert.equal(cleaned.full_name, "Jane Doe");
    assert.equal("gender" in cleaned, false);
    assert.equal("race" in cleaned, false);
  });
});

describe("experience duration parsing", () => {
  it("parses present roles", () => {
    const parsed = parseDurationRange("Jan 2020 – Present");
    assert.equal(parsed.start_date, "2020-01");
    assert.equal(parsed.is_current, true);
    assert.equal(parsed.end_date, null);
  });
});

describe("embeddings", () => {
  it("is stable and excludes contact PII from the vector source", () => {
    const a = buildNormalizedResume({ sourceText: FIXTURE });
    const b = buildNormalizedResume({ sourceText: FIXTURE });
    assert.deepEqual(a.embedding?.vector, b.embedding?.vector);
    const withoutEmail = buildNormalizedResume({
      sourceText: FIXTURE.replace("jane@example.com", "other@example.com"),
    });
    assert.ok(a.embedding && withoutEmail.embedding);
    assert.deepEqual(a.embedding.vector, withoutEmail.embedding.vector);
    assert.equal(a.embedding.model, "hash-ngram-v1");
  });
});

describe("text extraction errors", () => {
  it("rejects non-PDF bytes even when named as pdf", async () => {
    await assert.rejects(
      () => extractResumeTextFromBuffer(Buffer.from("hello world this is not a resume file"), "resume.pdf"),
      ValidationError,
    );
  });
});
