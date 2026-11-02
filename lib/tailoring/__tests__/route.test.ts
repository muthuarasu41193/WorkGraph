import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextResponse } from "next/server";

import { handleTailoringRequest } from "../handle.ts";
import type { Entitlement } from "../../subscription/entitlements.ts";
import type { TailoringRunResult } from "../service.ts";
import { buildSourceLines } from "../source.ts";

const USER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const RESETS = "2026-12-01T00:00:00.000Z";
const JOB_ID = "ext-job-42";

function request(body: unknown) {
  return new Request("http://localhost/api/tailoring", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function allowedPaid(): Entitlement {
  return {
    allowed: true,
    used: 0,
    limit: -1,
    resetsAt: null,
    tier: "premium",
    reason: "ok",
  };
}

function freeAllowed(): Entitlement {
  return {
    allowed: true,
    used: 0,
    limit: 2,
    resetsAt: RESETS,
    tier: "free",
    reason: "ok",
  };
}

function fakeRun(overrides?: Partial<TailoringRunResult>): TailoringRunResult {
  const source = buildSourceLines("Built billing APIs in Python.");
  return {
    suggestions: [
      {
        sourceId: "L1",
        rewrite: "Built billing APIs in Python for payments reliability.",
        jobRequirement: "APIs",
        sourceText: "Built billing APIs in Python.",
      },
    ],
    gaps: [{ requirement: "Kubernetes", tip: "Add only if true: mention cluster work if you have it." }],
    rejectedCount: 0,
    source,
    promptId: "evidence-tailoring-v1",
    attempts: 1,
    ...overrides,
  };
}

describe("POST /api/tailoring handler", () => {
  it("returns 401 when unauthenticated and does not call Groq", async () => {
    let ran = false;
    const response = await handleTailoringRequest(request({ jobId: JOB_ID }), {
      requireSession: async () => ({
        ok: false,
        response: NextResponse.json(
          { error: "Not authenticated. Please sign in and try again." },
          { status: 401 },
        ),
      }),
      run: async () => {
        ran = true;
        return fakeRun();
      },
    });
    assert.equal(response.status, 401);
    assert.equal(ran, false);
  });

  it("returns 402 when free user is over the tailoring limit and does not call Groq", async () => {
    let ran = false;
    let recorded = false;
    const response = await handleTailoringRequest(request({ jobId: JOB_ID }), {
      requireSession: async () => ({
        ok: true,
        userId: USER,
        supabase: {} as never,
      }),
      loadResume: async () => ({
        ok: true,
        resumeText: "Built billing APIs in Python.",
        skills: ["Python"],
      }),
      loadJob: async () => ({
        ok: true,
        jobId: JOB_ID,
        title: "Engineer",
        company: "Acme",
        description: "Requirements: Python, Kubernetes",
      }),
      canUseFeature: async (userId, feature) => {
        assert.equal(userId, USER);
        assert.equal(feature, "tailoring");
        return {
          allowed: false,
          used: 2,
          limit: 2,
          resetsAt: RESETS,
          tier: "free",
          reason: "limit_reached",
        };
      },
      run: async () => {
        ran = true;
        return fakeRun();
      },
      record: async () => {
        recorded = true;
      },
    });
    assert.equal(response.status, 402);
    assert.equal(ran, false);
    assert.equal(recorded, false);
    const body = await response.json();
    assert.deepEqual(body, {
      error: "limit_reached",
      used: 2,
      limit: 2,
      resetsAt: RESETS,
      upgradeUrl: "/pricing",
    });
  });

  it("allows a paid user and records usage after exactly one Groq call", async () => {
    let groqCalls = 0;
    const order: string[] = [];
    const response = await handleTailoringRequest(
      request({ jobId: JOB_ID, userId: OTHER, user_id: OTHER }),
      {
        requireSession: async () => ({
          ok: true,
          userId: USER,
          supabase: {} as never,
        }),
        loadResume: async () => ({
          ok: true,
          resumeText: "Built billing APIs in Python.",
          skills: ["Python"],
        }),
        loadJob: async (_session, jobId) => {
          assert.equal(jobId, JOB_ID);
          return {
            ok: true,
            jobId: JOB_ID,
            title: "Engineer",
            company: "Acme",
            description: "Requirements: Python",
          };
        },
        canUseFeature: async (userId) => {
          assert.equal(userId, USER);
          assert.notEqual(userId, OTHER);
          return allowedPaid();
        },
        run: async (params) => {
          order.push("run");
          groqCalls += 1;
          assert.equal(params.resumeText, "Built billing APIs in Python.");
          assert.equal(params.jobTitle, "Engineer");
          return fakeRun({ attempts: 1 });
        },
        record: async (userId, feature) => {
          order.push("record");
          assert.equal(userId, USER);
          assert.equal(feature, "tailoring");
        },
      },
    );
    assert.equal(response.status, 200);
    assert.equal(groqCalls, 1);
    assert.deepEqual(order, ["run", "record"]);
    const body = (await response.json()) as {
      suggestions: Array<{ rewrite: string; sourceText: string }>;
      gaps: unknown[];
      privacy: string;
    };
    assert.equal(body.suggestions.length, 1);
    assert.match(body.suggestions[0]?.sourceText ?? "", /billing APIs/);
    assert.match(body.privacy, /Groq/);
    assert.match(body.privacy, /not stored/i);
  });

  it("returns 404 when the job is missing", async () => {
    let ran = false;
    const response = await handleTailoringRequest(request({ jobId: "missing-job" }), {
      requireSession: async () => ({
        ok: true,
        userId: USER,
        supabase: {} as never,
      }),
      loadResume: async () => ({
        ok: true,
        resumeText: "Built billing APIs in Python.",
        skills: ["Python"],
      }),
      loadJob: async () => ({ ok: false, status: 404, error: "Job not found." }),
      canUseFeature: async () => freeAllowed(),
      run: async () => {
        ran = true;
        return fakeRun();
      },
    });
    assert.equal(response.status, 404);
    assert.equal(ran, false);
    const body = (await response.json()) as { error?: string };
    assert.match(body.error ?? "", /Job not found/);
  });

  it("returns 400 with a friendly message when resume text is missing", async () => {
    let ran = false;
    const response = await handleTailoringRequest(request({ jobId: JOB_ID }), {
      requireSession: async () => ({
        ok: true,
        userId: USER,
        supabase: {} as never,
      }),
      loadResume: async () => ({
        ok: false,
        status: 400,
        error: "No resume found. Upload your resume before tailoring for a job.",
      }),
      run: async () => {
        ran = true;
        return fakeRun();
      },
    });
    assert.equal(response.status, 400);
    assert.equal(ran, false);
    const body = (await response.json()) as { error?: string };
    assert.match(body.error ?? "", /Upload your resume/);
  });

  it("calls Groq once on the happy path when using the service complete mock", async () => {
    const { runEvidenceTailoring } = await import("../service.ts");
    let calls = 0;
    const result = await runEvidenceTailoring({
      resumeText: "Built billing APIs in Python that processed 2M requests per day.",
      jobTitle: "Backend Engineer",
      company: "Acme",
      jobDescription: "Requirements:\n- Python\n- APIs\n- Kubernetes",
      profileSkills: ["Python"],
      complete: async () => {
        calls += 1;
        return JSON.stringify({
          suggestions: [
            {
              sourceId: "L1",
              rewrite: "Built billing APIs in Python that processed 2M requests per day.",
              jobRequirement: "Python APIs",
            },
          ],
          gaps: [
            {
              requirement: "Kubernetes",
              tip: "Add only if true: mention Kubernetes if you have operated clusters.",
            },
          ],
        });
      },
    });
    assert.equal(calls, 1);
    assert.equal(result.attempts, 1);
    assert.equal(result.suggestions.length, 1);
    assert.equal(result.gaps.length, 1);
  });
});
