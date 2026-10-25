import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextResponse } from "next/server";

import { handleCoverLetterGenerate } from "../../cover-letters/handle-generate.ts";
import { coverLetterLimitNotice, parseCoverLetterLimitPayload } from "../limit-notice.ts";
import type { Entitlement } from "../entitlements.ts";

const USER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const RESETS = "2026-11-01T00:00:00.000Z";

function request(body: unknown) {
  return new Request("http://localhost/api/cover-letters/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  jobTitle: "Engineer",
  company: "Acme",
  jobDescription: "Build APIs for the billing team.",
  userId: OTHER,
  user_id: OTHER,
};

function supabaseWithResume(text: string | null, missing = false) {
  return {
    from(table: string) {
      assert.equal(table, "profiles");
      return {
        select() {
          return this;
        },
        eq(column: string, value: string) {
          assert.equal(column, "id");
          assert.equal(value, USER);
          return this;
        },
        async single() {
          if (missing) return { data: null, error: { message: "hidden" } };
          return { data: { id: USER, resume_raw_text: text }, error: null };
        },
      };
    },
  };
}

function allowed(): Entitlement {
  return {
    allowed: true,
    used: 1,
    limit: 3,
    resetsAt: RESETS,
    tier: "free",
    reason: "ok",
  };
}

describe("cover letter generation gate", () => {
  it("returns 400 for an invalid body and does not check a session", async () => {
    let sessionCalled = false;
    const response = await handleCoverLetterGenerate(request({}), {
      requireSession: async () => {
        sessionCalled = true;
        throw new Error("should not authenticate");
      },
    });
    assert.equal(response.status, 400);
    assert.equal(sessionCalled, false);
    const body = (await response.json()) as { error?: string };
    assert.equal(typeof body.error, "string");
    assert.equal(JSON.stringify(body).includes("resume"), false);
  });

  it("returns 401 when the session is missing and does not generate", async () => {
    let generated = false;
    const response = await handleCoverLetterGenerate(request(validBody), {
      requireSession: async () => ({
        ok: false,
        response: NextResponse.json(
          { error: "Not authenticated. Please sign in and try again." },
          { status: 401 },
        ),
      }),
      generate: async () => {
        generated = true;
        return { letter: "letter", warnings: [] };
      },
    });
    assert.equal(response.status, 401);
    assert.equal(generated, false);
    const body = (await response.json()) as { error?: string };
    assert.match(body.error ?? "", /Not authenticated/);
  });

  it("returns 402 at the free cap and does not call Groq", async () => {
    let generated = false;
    let recorded = false;
    const response = await handleCoverLetterGenerate(request(validBody), {
      requireSession: async () => ({
        ok: true,
        userId: USER,
        supabase: supabaseWithResume("Shipped billing APIs.") as never,
      }),
      canUseFeature: async (userId, feature) => {
        assert.equal(userId, USER);
        assert.equal(feature, "cover_letter");
        assert.notEqual(userId, OTHER);
        return {
          allowed: false,
          used: 3,
          limit: 3,
          resetsAt: RESETS,
          tier: "free",
          reason: "limit_reached",
        };
      },
      generate: async () => {
        generated = true;
        return { letter: "letter", warnings: [] };
      },
      record: async () => {
        recorded = true;
      },
    });

    assert.equal(response.status, 402);
    assert.equal(generated, false);
    assert.equal(recorded, false);
    const body = await response.json();
    assert.deepEqual(body, {
      error: "limit_reached",
      used: 3,
      limit: 3,
      resetsAt: RESETS,
      upgradeUrl: "/pricing",
    });
  });

  it("generates for an allowed user and records usage only after success, ignoring a client user id", async () => {
    const order: string[] = [];
    let recordedFor = "";
    const response = await handleCoverLetterGenerate(request(validBody), {
      requireSession: async () => ({
        ok: true,
        userId: USER,
        supabase: supabaseWithResume("Shipped billing APIs.") as never,
      }),
      canUseFeature: async (userId) => {
        assert.equal(userId, USER);
        return allowed();
      },
      generate: async (input) => {
        order.push("generate");
        assert.equal(input.resumeText, "Shipped billing APIs.");
        assert.equal(input.jobTitle, "Engineer");
        return { letter: "Dear hiring team, I shipped billing APIs.", warnings: [] };
      },
      record: async (userId, feature) => {
        order.push("record");
        recordedFor = userId;
        assert.equal(feature, "cover_letter");
      },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(order, ["generate", "record"]);
    assert.equal(recordedFor, USER);
    const body = (await response.json()) as { letter?: string };
    assert.match(body.letter ?? "", /billing APIs/);
  });

  it("does not record usage when generation fails", async () => {
    let recorded = false;
    const response = await handleCoverLetterGenerate(request(validBody), {
      requireSession: async () => ({
        ok: true,
        userId: USER,
        supabase: supabaseWithResume("Shipped billing APIs.") as never,
      }),
      canUseFeature: async () => allowed(),
      generate: async () => {
        throw new Error("provider unavailable");
      },
      record: async () => {
        recorded = true;
      },
    });
    assert.equal(response.status, 500);
    assert.equal(recorded, false);
    const body = (await response.json()) as { error?: string };
    assert.equal(body.error?.includes("provider unavailable"), false);
  });

  it("returns 503 when the entitlement check cannot reach the database", async () => {
    let generated = false;
    const response = await handleCoverLetterGenerate(request(validBody), {
      requireSession: async () => ({
        ok: true,
        userId: USER,
        supabase: supabaseWithResume("Shipped billing APIs.") as never,
      }),
      canUseFeature: async () => ({
        allowed: false,
        used: 0,
        limit: 3,
        resetsAt: RESETS,
        tier: "free",
        reason: "unavailable",
      }),
      generate: async () => {
        generated = true;
        return { letter: "letter", warnings: [] };
      },
    });
    assert.equal(response.status, 503);
    assert.equal(generated, false);
    const body = (await response.json()) as { error?: string };
    assert.equal(body.error, "Could not generate a cover letter. Please try again.");
  });

  it("still returns the letter when the usage insert fails, without logging the database text", async () => {
    const lines: string[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => {
      lines.push(args.map((part) => String(part)).join(" "));
    };
    try {
      const response = await handleCoverLetterGenerate(request(validBody), {
        requireSession: async () => ({
          ok: true,
          userId: USER,
          supabase: supabaseWithResume("Shipped billing APIs.") as never,
        }),
        canUseFeature: async () => allowed(),
        generate: async () => ({ letter: "Dear hiring team", warnings: [] }),
        record: async () => {
          const error = new Error("person@example.com resume row");
          error.name = "PostgrestError";
          throw error;
        },
      });
      assert.equal(response.status, 200);
      const body = (await response.json()) as { letter?: string };
      assert.equal(body.letter, "Dear hiring team");
    } finally {
      console.error = original;
    }
    assert.equal(lines.some((line) => line.includes("usage_record_failed")), true);
    assert.equal(lines.some((line) => line.includes("person@example.com")), false);
    assert.equal(lines.some((line) => line.includes("resume row")), false);
  });
});

describe("cover letter limit copy", () => {
  it("uses a neutral sentence and a UTC reset date", () => {
    const payload = parseCoverLetterLimitPayload({
      error: "limit_reached",
      used: 3,
      limit: 3,
      resetsAt: RESETS,
      upgradeUrl: "/pricing",
    });
    assert.deepEqual(payload, { limit: 3, resetsAt: RESETS });
    assert.equal(
      coverLetterLimitNotice(3, RESETS),
      "You've used your 3 free cover letters this month. They reset on 1 November 2026.",
    );
  });
});
