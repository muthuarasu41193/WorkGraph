import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { handleCoverLetterGenerate, type CoverLetterGenerateDependencies } from "../handle-generate";
import type { CoverLetterSession } from "../session";

const SESSION_USER = "11111111-1111-4111-8111-111111111111";
const ATTACKER = "22222222-2222-4222-8222-222222222222";

function request(body: unknown): Request {
  return new Request("http://localhost/api/cover-letters/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  jobTitle: "Software Engineer",
  company: "Acme Corp",
  jobDescription: "Build APIs.",
  userId: ATTACKER,
  resumeText: "Invented resume from the client.",
};

function sessionOk(): CoverLetterSession {
  return {
    ok: true,
    userId: SESSION_USER,
    supabase: {} as SupabaseClient,
  };
}

describe("cover letter generate route", () => {
  it("rejects invalid input before checking the session", async () => {
    let sessionChecked = false;
    const deps: CoverLetterGenerateDependencies = {
      requireSession: async () => {
        sessionChecked = true;
        return { ok: false, response: NextResponse.json({ error: "nope" }, { status: 401 }) };
      },
      loadResumeText: async () => ({ ok: true, resumeText: "resume" }),
      generate: async () => ({ letter: "should not run", warnings: [] }),
    };

    const response = await handleCoverLetterGenerate(request({ jobTitle: "Only a title" }), deps);
    assert.equal(response.status, 400);
    const body = (await response.json()) as { error?: string };
    assert.equal(typeof body.error, "string");
    assert.equal(sessionChecked, false);
  });

  it("requires a session and does not generate without one", async () => {
    let generated = false;
    const deps: CoverLetterGenerateDependencies = {
      requireSession: async () => ({
        ok: false,
        response: NextResponse.json(
          { error: "Not authenticated. Please sign in and try again." },
          { status: 401 },
        ),
      }),
      loadResumeText: async () => ({ ok: true, resumeText: "resume" }),
      generate: async () => {
        generated = true;
        return { letter: "nope", warnings: [] };
      },
    };

    const response = await handleCoverLetterGenerate(request(validBody), deps);
    assert.equal(response.status, 401);
    const body = (await response.json()) as { error?: string };
    assert.match(body.error ?? "", /Not authenticated/);
    assert.equal(generated, false);
  });

  it("generates from the session user's resume and returns warnings", async () => {
    let loadedFor = "";
    let generatedResume = "";
    const deps: CoverLetterGenerateDependencies = {
      requireSession: async () => sessionOk(),
      loadResumeText: async (session) => {
        loadedFor = session.userId;
        return { ok: true, resumeText: "Session resume for Acme Corp." };
      },
      generate: async (params) => {
        generatedResume = params.resumeText;
        assert.equal(params.jobTitle, "Software Engineer");
        assert.equal(params.company, "Acme Corp");
        return {
          letter: "I worked at Acme Corp.",
          warnings: ["Check these claims before sending: 45%"],
        };
      },
      canUseFeature: async (userId) => {
        assert.equal(userId, SESSION_USER);
        return {
          allowed: true,
          used: 0,
          limit: 3,
          resetsAt: null,
          tier: "free",
          reason: "ok",
        };
      },
      record: async (userId) => {
        assert.equal(userId, SESSION_USER);
      },
    };

    const response = await handleCoverLetterGenerate(request(validBody), deps);
    assert.equal(response.status, 200);
    const body = (await response.json()) as { letter?: string; warnings?: string[]; userId?: string };
    assert.equal(loadedFor, SESSION_USER);
    assert.notEqual(loadedFor, ATTACKER);
    assert.equal(generatedResume, "Session resume for Acme Corp.");
    assert.equal(generatedResume.includes("Invented resume"), false);
    assert.equal(body.letter, "I worked at Acme Corp.");
    assert.deepEqual(body.warnings, ["Check these claims before sending: 45%"]);
    assert.equal(body.userId, undefined);
  });

  it("returns the profile error when the session user has no resume", async () => {
    let generated = false;
    const deps: CoverLetterGenerateDependencies = {
      requireSession: async () => sessionOk(),
      loadResumeText: async () => ({
        ok: false,
        status: 400,
        error: "No resume found. Please upload your resume first.",
      }),
      generate: async () => {
        generated = true;
        return { letter: "nope", warnings: [] };
      },
    };

    const response = await handleCoverLetterGenerate(request(validBody), deps);
    assert.equal(response.status, 400);
    const body = (await response.json()) as { error?: string };
    assert.match(body.error ?? "", /No resume found/);
    assert.equal(generated, false);
  });

  it("wires the route to the session check and the existing generate schema", () => {
    const route = readFileSync("app/api/cover-letters/generate/route.ts", "utf8");
    const handler = readFileSync("lib/cover-letters/handle-generate.ts", "utf8");
    assert.match(route, /requireCoverLetterSession/);
    assert.match(route, /handleCoverLetterGenerate/);
    assert.match(handler, /coverLetterGenerateSchema/);
    assert.match(handler, /resumeText: resume\.resumeText/);
    assert.doesNotMatch(handler, /body\.userId|body\.resumeText/);
  });
});
