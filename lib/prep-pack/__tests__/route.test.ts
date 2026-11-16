import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PREP_PACK_ESTIMATE_NOTICE } from "../build.ts";
import {
  handlePrepPackBuild,
  handlePrepPackDelete,
  handlePrepPackGet,
  handlePrepPackList,
  handlePrepPackSave,
  PREP_PACK_RATE_LIMIT,
} from "../handle.ts";
import { PrepPackApiError } from "../server.ts";
import type { PrepPackResult, SavedPrepPack } from "../types.ts";

const GUIDE_ID = "11111111-1111-4111-8111-111111111111";
const PACK_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function buildRequest(body: unknown) {
  return new Request("http://localhost/api/prep-pack", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.10" },
    body: JSON.stringify(body),
  });
}

function samplePack(status: PrepPackResult["status"] = "ok"): PrepPackResult {
  return {
    role: { id: "frontend-engineer", label: "Frontend engineer" },
    skills: [{ name: "React", source: "role_focus" }],
    guides:
      status === "ok"
        ? [
            {
              id: GUIDE_ID,
              company: "Acme",
              role: "Frontend Engineer",
              level: "L4",
              difficulty: "medium",
              rounds: 3,
              avg_rating: 4,
              price_inr: 0,
              href: `/interview-vault/${GUIDE_ID}`,
              why: ["Role match: Frontend engineer"],
              score: 18,
            },
          ]
        : [],
    checklist: [{ id: "general-0", round: "General", text: "Write three questions." }],
    estimateNotice: PREP_PACK_ESTIMATE_NOTICE,
    status,
  };
}

function sampleSaved(): SavedPrepPack {
  const pack = samplePack();
  return {
    id: PACK_ID,
    role_id: pack.role?.id ?? null,
    role_label: pack.role?.label ?? null,
    skill_count: pack.skills.length,
    guide_count: pack.guides.length,
    created_at: "2026-11-12T00:00:00.000Z",
    updated_at: "2026-11-12T00:00:00.000Z",
    skills: pack.skills,
    guides: pack.guides,
    checklist: pack.checklist,
    estimate_notice: pack.estimateNotice,
  };
}

describe("POST /api/prep-pack handler", () => {
  it("rejects empty payloads with a validation error", async () => {
    const response = await handlePrepPackBuild(buildRequest({}), {
      rateLimit: () => ({ allowed: true, retryAfterSec: 0 }),
      build: async () => samplePack(),
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.ok, false);
    assert.match(String(body.error), /job description|role/i);
  });

  it("rejects oversized job descriptions", async () => {
    const response = await handlePrepPackBuild(
      buildRequest({ jobDescription: "x".repeat(32_001) }),
      {
        rateLimit: () => ({ allowed: true, retryAfterSec: 0 }),
        build: async () => samplePack(),
      },
    );
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.ok, false);
  });

  it("returns the pack for a valid role without auth", async () => {
    let built = false;
    const response = await handlePrepPackBuild(buildRequest({ roleId: "frontend-engineer" }), {
      rateLimit: () => ({ allowed: true, retryAfterSec: 0 }),
      build: async (input) => {
        built = true;
        assert.equal(input.roleId, "frontend-engineer");
        return samplePack("ok");
      },
    });
    assert.equal(built, true);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.status, "ok");
    assert.equal(body.pack.guides[0].href, `/interview-vault/${GUIDE_ID}`);
  });

  it("surfaces no_matches as a distinct status", async () => {
    const response = await handlePrepPackBuild(buildRequest({ roleId: "sales" }), {
      rateLimit: () => ({ allowed: true, retryAfterSec: 0 }),
      build: async () => samplePack("no_matches"),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, "no_matches");
    assert.equal(body.pack.guides.length, 0);
  });

  it("rate-limits by IP without calling build", async () => {
    let built = false;
    const response = await handlePrepPackBuild(buildRequest({ roleId: "sales" }), {
      rateLimit: () => ({ allowed: false, retryAfterSec: 42 }),
      build: async () => {
        built = true;
        return samplePack();
      },
    });
    assert.equal(built, false);
    assert.equal(response.status, 429);
    assert.equal(response.headers.get("Retry-After"), "42");
    assert.ok(PREP_PACK_RATE_LIMIT >= 1);
  });

  it("returns a generic 500 without echoing input", async () => {
    const response = await handlePrepPackBuild(
      buildRequest({
        roleId: "frontend-engineer",
        jobDescription: "SECRET_JD_SHOULD_NOT_APPEAR",
      }),
      {
        rateLimit: () => ({ allowed: true, retryAfterSec: 0 }),
        build: async () => {
          throw new Error("SECRET_JD_SHOULD_NOT_APPEAR boom");
        },
      },
    );
    assert.equal(response.status, 500);
    const body = await response.json();
    assert.equal(body.ok, false);
    assert.equal(String(body.error).includes("SECRET_JD_SHOULD_NOT_APPEAR"), false);
  });
});

describe("POST /api/prep-pack/save authorization", () => {
  it("returns 401 when unauthenticated", async () => {
    const response = await handlePrepPackSave(
      buildRequest({
        roleId: "frontend-engineer",
        roleLabel: "Frontend engineer",
        skills: [{ name: "React", source: "role_focus" }],
        guides: samplePack().guides,
        checklist: samplePack().checklist,
        estimateNotice: PREP_PACK_ESTIMATE_NOTICE,
      }),
      {
        save: async () => {
          throw new PrepPackApiError("Unauthorized", 401);
        },
      },
    );
    assert.equal(response.status, 401);
    const body = await response.json();
    assert.equal(body.ok, false);
  });

  it("rejects bodies that include a raw jobDescription", async () => {
    let saved = false;
    const response = await handlePrepPackSave(
      buildRequest({
        jobDescription: "should not be stored",
        roleId: "frontend-engineer",
        roleLabel: "Frontend engineer",
        skills: [],
        guides: [],
        checklist: [],
        estimateNotice: PREP_PACK_ESTIMATE_NOTICE,
      }),
      {
        save: async () => {
          saved = true;
          return sampleSaved();
        },
      },
    );
    assert.equal(saved, false);
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.match(String(body.error), /not stored/i);
  });

  it("saves derived packs for an authenticated owner path", async () => {
    const response = await handlePrepPackSave(
      buildRequest({
        roleId: "frontend-engineer",
        roleLabel: "Frontend engineer",
        skills: [{ name: "React", source: "role_focus" }],
        guides: samplePack().guides,
        checklist: samplePack().checklist,
        estimateNotice: PREP_PACK_ESTIMATE_NOTICE,
      }),
      {
        save: async (input) => {
          assert.equal(input.roleId, "frontend-engineer");
          assert.equal("jobDescription" in input, false);
          return sampleSaved();
        },
      },
    );
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.pack.id, PACK_ID);
  });
});

describe("saved pack get/list/delete authz", () => {
  it("lists only through the owner-scoped dependency", async () => {
    const response = await handlePrepPackList({
      list: async () => [
        {
          id: PACK_ID,
          role_id: "frontend-engineer",
          role_label: "Frontend engineer",
          skill_count: 1,
          guide_count: 1,
          created_at: "2026-11-12T00:00:00.000Z",
          updated_at: "2026-11-12T00:00:00.000Z",
        },
      ],
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.packs.length, 1);
  });

  it("returns 401 for list when unauthorized", async () => {
    const response = await handlePrepPackList({
      list: async () => {
        throw new PrepPackApiError("Unauthorized", 401);
      },
    });
    assert.equal(response.status, 401);
  });

  it("get requires a valid id and owner scope", async () => {
    const missing = await handlePrepPackGet(PACK_ID, {
      get: async (id) => {
        assert.equal(id, PACK_ID);
        return null;
      },
    });
    assert.equal(missing.status, 404);

    const unauthorized = await handlePrepPackGet(PACK_ID, {
      get: async () => {
        throw new PrepPackApiError("Unauthorized", 401);
      },
    });
    assert.equal(unauthorized.status, 401);
  });

  it("delete is owner-scoped and 404s when missing", async () => {
    const response = await handlePrepPackDelete(PACK_ID, {
      remove: async (id) => {
        assert.equal(id, PACK_ID);
        throw new PrepPackApiError("Prep pack not found.", 404);
      },
    });
    assert.equal(response.status, 404);
  });
});
