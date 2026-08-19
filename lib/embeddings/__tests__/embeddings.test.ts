import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { benchmarkSimilaritySearch } from "../benchmark";
import { generateEmbedding, generateEmbeddingBatch, redactPiiForEmbedding } from "../generate";
import { withRetry, publicErrorCode } from "../retry";
import {
  draftsFromJobs,
  draftsFromNormalizedResume,
  generateDrafts,
  searchSimilar,
} from "../service";
import { cosineSimilarity, searchSimilarVectors } from "../similarity";
import {
  jobRequirementsEmbeddingText,
  profileEmbeddingText,
  skillEmbeddingText,
} from "../texts";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL_VERSION } from "../types";

describe("embedding generation", () => {
  it("is stable, versioned, and 256-d", () => {
    const a = generateEmbedding("Python FastAPI PostgreSQL");
    const b = generateEmbedding("Python FastAPI PostgreSQL");
    assert.equal(a.model_version, EMBEDDING_MODEL_VERSION);
    assert.equal(a.dimensions, EMBEDDING_DIMENSIONS);
    assert.equal(a.vector.length, EMBEDDING_DIMENSIONS);
    assert.deepEqual(a.vector, b.vector);
    assert.equal(a.content_hash, b.content_hash);
  });

  it("does not send or keep emails in the hashed source", () => {
    const withEmail = generateEmbedding("Engineer jane@example.com Python");
    const withoutEmail = generateEmbedding("Engineer Python");
    assert.deepEqual(withEmail.vector, withoutEmail.vector);
    assert.equal(redactPiiForEmbedding("call +1 415-555-0100 please").includes("415"), false);
  });

  it("batches without changing single-item output", () => {
    const texts = ["React TypeScript", "Java Spring"];
    const batch = generateEmbeddingBatch(texts);
    assert.equal(batch.length, 2);
    assert.deepEqual(batch[0]?.vector, generateEmbedding(texts[0]!).vector);
  });
});

describe("entity texts", () => {
  it("builds profile and skill texts without contact fields", () => {
    const profile = profileEmbeddingText({
      headline: "Software Engineer",
      summary: "Builds APIs in Python",
      skills: ["Python"],
    });
    assert.ok(profile.includes("Python"));
    assert.equal(profile.toLowerCase().includes("email"), false);
    assert.ok(skillEmbeddingText("Python", "python", "technical").includes("Python"));
  });

  it("extracts a requirements section when present", () => {
    const text = jobRequirementsEmbeddingText(
      "We are hiring.\nRequirements:\n- Python\n- PostgreSQL\nBenefits:\n- Snacks",
      "Backend Engineer",
    );
    assert.ok(text.toLowerCase().includes("python"));
  });
});

describe("similarity search", () => {
  it("ranks a closer document above an unrelated one", async () => {
    const hits = await searchSimilar("python fastapi postgres", [
      {
        entity_type: "job_description",
        entity_id: "1",
        owner_user_id: null,
        text: "Backend engineer Python FastAPI PostgreSQL",
      },
      {
        entity_type: "job_description",
        entity_id: "2",
        owner_user_id: null,
        text: "Retail cashier weekend shifts",
      },
    ]);
    assert.equal(hits[0]?.entity_id, "1");
    assert.ok((hits[0]?.similarity ?? 0) > (hits[1]?.similarity ?? 0));
  });

  it("cosine of identical vectors is 1", () => {
    const v = generateEmbedding("kubernetes docker aws").vector;
    assert.ok(Math.abs(cosineSimilarity(v, v) - 1) < 1e-6);
  });
});

describe("drafts, retry, and failure handling", () => {
  it("builds drafts for profile, resume, skills, experience, and projects", () => {
    const drafts = draftsFromNormalizedResume("user-1", {
      professional_summary: { value: "Python backend engineer" },
      skills: [{ skill: "Python", canonical: "python", category: "technical" }],
      target_roles: [{ value: "Software Engineer" }],
      seniority: { value: "Senior" },
      identity: { headline: { value: "Software Engineer" } },
      experience: [{ title: "Engineer", company: "Acme", duration: "2020-2024", description: "APIs" }],
      projects: [{ name: "Inventory", description: "Python service" }],
    });
    const types = new Set(drafts.map((d) => d.entity_type));
    assert.ok(types.has("profile"));
    assert.ok(types.has("resume"));
    assert.ok(types.has("skill"));
    assert.ok(types.has("experience"));
    assert.ok(types.has("project"));
    const generated = generateDrafts(drafts);
    assert.ok(generated.every((row) => row.status === "completed" || row.status === "skipped"));
    assert.ok(generated.some((row) => row.model_version === EMBEDDING_MODEL_VERSION));
  });

  it("builds job description and requirements drafts", () => {
    const drafts = draftsFromJobs([
      {
        id: 42,
        title: "Data Engineer",
        company: "Acme",
        description: "Requirements:\n- SQL\n- Python",
      },
    ]);
    assert.equal(drafts.some((d) => d.entity_type === "job_description"), true);
    assert.equal(drafts.some((d) => d.entity_type === "job_requirements"), true);
  });

  it("skips empty text instead of inventing a vector", () => {
    const [row] = generateDrafts([
      { entity_type: "skill", entity_id: "x", owner_user_id: "u", text: "   " },
    ]);
    assert.equal(row?.status, "skipped");
    assert.equal(row?.error_code, "empty_text");
    assert.equal(row?.vector, null);
  });

  it("retries a transient failure then succeeds", async () => {
    let calls = 0;
    const value = await withRetry(async () => {
      calls += 1;
      if (calls < 3) throw new Error("ECONNRESET");
      return 7;
    }, { attempts: 3, backoffMs: 0 });
    assert.equal(value, 7);
    assert.equal(calls, 3);
  });

  it("maps failures to non-PII error codes", () => {
    assert.equal(publicErrorCode(new Error("ECONNRESET from host")), "transient_failure");
    assert.equal(publicErrorCode(new Error("duplicate key value")), "conflict");
    assert.equal(publicErrorCode(new Error("resume text: secret@example.com")), "persist_failed");
  });
});

describe("benchmark", () => {
  it("searches a 2k corpus quickly enough for interactive use", () => {
    const report = benchmarkSimilaritySearch({ corpusSize: 2000, topK: 10 });
    assert.equal(report.dimensions, EMBEDDING_DIMENSIONS);
    assert.equal(report.corpus_size, 2000);
    assert.ok(report.search_ms < 250, `search_ms=${report.search_ms}`);
    assert.ok(report.total_ms < 5000, `total_ms=${report.total_ms}`);
    // Keep the numbers in the test log for local comparison.
    console.log(
      `embedding benchmark: generate=${report.generate_ms}ms search=${report.search_ms}ms total=${report.total_ms}ms qps=${report.searches_per_second} n=${report.corpus_size} dim=${report.dimensions}`,
    );
  });
});

describe("in-memory top-k", () => {
  it("returns at most k hits", () => {
    const query = generateEmbedding("react").vector;
    const items = ["react", "vue", "angular", "python"].map((text, i) => ({
      id: String(i),
      vector: generateEmbedding(text).vector,
    }));
    const hits = searchSimilarVectors(query, items, 2);
    assert.equal(hits.length, 2);
  });
});
