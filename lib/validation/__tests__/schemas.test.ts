import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applicationIdSchema,
  applicationInsertSchema,
  applicationStatusSchema,
  applicationUpdateSchema,
  careerPreferencesSchema,
  coverLetterGenerateSchema,
  coverLetterSaveSchema,
  educationListSchema,
  jobSchema,
  looksLikeInternalError,
  parseAiAtsFeedback,
  parseAiParsedResume,
  parseJobSearchQuery,
  parseSavedJobIds,
  parseWithSchema,
  profileManualInputSchema,
  skillsInputSchema,
  talentIntelligenceAnalyzeSchema,
  ValidationError,
  workExperienceListSchema,
} from "../index";
import { parseResumeUploadFile } from "../resume";

describe("profile schemas", () => {
  it("accepts a valid manual profile", () => {
    const data = parseWithSchema(profileManualInputSchema, {
      email: "ada@example.com",
      full_name: "Ada Lovelace",
      skills: ["Python", "Math"],
      experience: ["Analyst at Analytical Engine"],
      education: ["BA Mathematics"],
    });
    assert.equal(data.email, "ada@example.com");
    assert.deepEqual(data.skills, ["Python", "Math"]);
  });

  it("rejects an invalid email", () => {
    assert.throws(
      () => parseWithSchema(profileManualInputSchema, { email: "not-an-email" }),
      ValidationError,
    );
  });

  it("allows omitting email", () => {
    const data = parseWithSchema(profileManualInputSchema, { full_name: "Ada" });
    assert.equal(data.full_name, "Ada");
    assert.equal(data.email, undefined);
  });
});

describe("skills, experience, education", () => {
  it("accepts valid skills and rejects oversized lists", () => {
    assert.deepEqual(parseWithSchema(skillsInputSchema, ["React", " SQL "]), ["React", "SQL"]);
    assert.throws(
      () => parseWithSchema(skillsInputSchema, Array.from({ length: 101 }, (_, i) => `s${i}`)),
      ValidationError,
    );
  });

  it("accepts experience and education objects", () => {
    const experience = parseWithSchema(workExperienceListSchema, [
      { title: "Engineer", company: "Acme", duration: "2020-2024", description: "Built APIs" },
    ]);
    assert.equal(experience[0]?.company, "Acme");
    const education = parseWithSchema(educationListSchema, [
      { degree: "BSc", institution: "MIT", year: "2018" },
    ]);
    assert.equal(education[0]?.institution, "MIT");
  });

  it("rejects non-array skills", () => {
    assert.throws(() => parseWithSchema(skillsInputSchema, "python"), ValidationError);
  });
});

describe("career preferences", () => {
  it("accepts valid preferences", () => {
    const data = parseWithSchema(careerPreferencesSchema, {
      locationMode: "remote",
      jobTypes: ["Full-time"],
      visaSponsorshipOnly: true,
      salaryMin: 80,
      salaryMax: 160,
    });
    assert.equal(data.locationMode, "remote");
  });

  it("rejects inverted salary range", () => {
    assert.throws(
      () => parseWithSchema(careerPreferencesSchema, { salaryMin: 200, salaryMax: 50 }),
      ValidationError,
    );
  });
});

describe("job search query params", () => {
  it("parses catalog filters", () => {
    const query = parseJobSearchQuery(
      new URLSearchParams({
        q: "engineer",
        src: "greenhouse,lever",
        date: "7",
        locMode: "remote",
        page: "2",
        page_size: "50",
        type: "Full-time",
      }),
    );
    assert.equal(query.q, "engineer");
    assert.deepEqual(query.sources, ["greenhouse", "lever"]);
    assert.equal(query.dateWindow, "7");
    assert.equal(query.locationMode, "remote");
    assert.equal(query.page, 2);
    assert.equal(query.pageSize, 50);
    assert.deepEqual(query.filters?.jobTypes, ["Full-time"]);
  });

  it("ignores invalid optional filters instead of failing", () => {
    const query = parseJobSearchQuery(new URLSearchParams({ date: "nope", locMode: "orbit", page: "abc" }));
    assert.equal(query.dateWindow, undefined);
    assert.equal(query.locationMode, undefined);
    assert.equal(query.page, 1);
  });
});

describe("job schema", () => {
  it("accepts a listing", () => {
    const job = parseWithSchema(jobSchema, {
      id: 12,
      title: "Engineer",
      company: "Acme",
      location: "Remote",
    });
    assert.equal(job.title, "Engineer");
  });

  it("rejects a missing title", () => {
    assert.throws(() => parseWithSchema(jobSchema, { id: "1", company: "Acme" }), ValidationError);
  });
});

describe("applications", () => {
  it("accepts a valid insert", () => {
    const data = parseWithSchema(applicationInsertSchema, {
      company: "Acme",
      role: "Engineer",
      status: "applied",
      applied_date: "2026-08-18",
      job_url: null,
      next_step_date: null,
    });
    assert.equal(data.company, "Acme");
    assert.equal(data.status, "applied");
  });

  it("rejects missing company/role", () => {
    assert.throws(() => parseWithSchema(applicationInsertSchema, { company: "", role: "" }), ValidationError);
  });

  it("rejects an invalid status", () => {
    assert.equal(applicationStatusSchema.safeParse("hired").success, false);
    assert.throws(
      () => parseWithSchema(applicationUpdateSchema, { status: "ghosted" }),
      ValidationError,
    );
  });

  it("validates application ids as uuids", () => {
    assert.equal(applicationIdSchema.safeParse("not-a-uuid").success, false);
    assert.equal(applicationIdSchema.safeParse("3b8c0d2e-1f2a-4b5c-8d9e-0a1b2c3d4e5f").success, true);
  });
});

describe("saved jobs", () => {
  it("keeps valid ids and drops junk", () => {
    assert.deepEqual(parseSavedJobIds(["job-1", 12, "", "job-2"]), ["job-1", "job-2"]);
    assert.deepEqual(parseSavedJobIds({ nope: true }), []);
  });
});

describe("AI structured output", () => {
  it("coerces a messy resume parse into a safe object", () => {
    const parsed = parseAiParsedResume({
      full_name: "  Ada  ",
      years_of_experience: "7",
      skills: ["Python", 3, ""],
      education: [{ degree: "BA", institution: "London", year: "1840" }],
      work_experience: "not-a-list",
      extra_field: "drop me",
    });
    assert.equal(parsed.full_name, "Ada");
    assert.equal(parsed.years_of_experience, 7);
    assert.deepEqual(parsed.skills, ["Python"]);
    assert.equal(parsed.work_experience.length, 0);
    assert.equal(parsed.education[0]?.institution, "London");
  });

  it("coerces ATS JSON and ignores invalid grades", () => {
    const ats = parseAiAtsFeedback({
      score: 140,
      grade: "z",
      strengths: ["Clear headings"],
      keyword_density: "HIGH",
    });
    assert.equal(ats.score, 100);
    assert.equal(ats.grade, "F");
    assert.equal(ats.keyword_density, "high");
    assert.deepEqual(ats.strengths, ["Clear headings"]);
  });
});

describe("talent intelligence request", () => {
  it("requires a job description of at least 80 characters", () => {
    assert.throws(
      () => parseWithSchema(talentIntelligenceAnalyzeSchema, { jobDescription: "too short" }),
      ValidationError,
    );
    const data = parseWithSchema(talentIntelligenceAnalyzeSchema, {
      jobDescription: "x".repeat(80),
      jobId: 42,
    });
    assert.equal(data.jobId, "42");
  });
});

describe("resume upload", () => {
  it("rejects missing files and disallowed types", () => {
    assert.throws(() => parseResumeUploadFile(null), ValidationError);
    const file = new File(["hello"], "notes.txt", { type: "text/plain" });
    assert.throws(() => parseResumeUploadFile(file), /PDF and DOCX/);
  });

  it("accepts a pdf under the size cap", () => {
    const file = new File(["%PDF-fake"], "resume.pdf", { type: "application/pdf" });
    const parsed = parseResumeUploadFile(file);
    assert.equal(parsed.name, "resume.pdf");
  });
});

describe("error sanitization", () => {
  it("flags database and secret leaks as internal", () => {
    assert.equal(looksLikeInternalError("duplicate key value violates unique constraint"), true);
    assert.equal(looksLikeInternalError("Missing required environment variable: GROQ_API_KEY"), true);
    assert.equal(looksLikeInternalError("Company and role are required"), false);
  });

  it("ValidationError exposes field details without a stack requirement", () => {
    try {
      parseWithSchema(profileManualInputSchema, { email: "bad" });
      assert.fail("expected throw");
    } catch (error) {
      assert.ok(error instanceof ValidationError);
      assert.equal(error.status, 400);
      assert.ok(error.details[0]?.field.includes("email"));
    }
  });
});

describe("cover letter schemas", () => {
  it("accepts a generate payload and rejects missing fields", () => {
    const data = parseWithSchema(coverLetterGenerateSchema, {
      jobTitle: " Backend Engineer ",
      company: " Acme ",
      jobDescription: "Build APIs.",
    });
    assert.equal(data.jobTitle, "Backend Engineer");
    assert.equal(data.company, "Acme");
    assert.throws(
      () => parseWithSchema(coverLetterGenerateSchema, { jobTitle: "X", company: "Y" }),
      ValidationError,
    );
  });

  it("accepts a save payload with optional job description", () => {
    const data = parseWithSchema(coverLetterSaveSchema, {
      jobTitle: "PM",
      company: "Globex",
      letter: "Dear hiring manager,\n\nI am writing...",
    });
    assert.equal(data.jobDescription, undefined);
    assert.equal(data.letter.startsWith("Dear"), true);
    assert.throws(
      () => parseWithSchema(coverLetterSaveSchema, { jobTitle: "PM", company: "Globex", letter: "   " }),
      ValidationError,
    );
  });
});
