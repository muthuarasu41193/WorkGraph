import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  handlePrepPackShareCreate,
  handlePrepPackShareResolve,
  handlePrepPackShareRevoke,
} from "../handle.ts";
import { publicShareContainsPrivateKey, toPublicSharedPrepPack } from "../share-public.ts";
import {
  generatePrepPackShareToken,
  hashPrepPackShareToken,
  isPlausibleShareToken,
  shareTokenHashesEqual,
} from "../share-token.ts";
import type { SavedPrepPack } from "../types.ts";

const PACK_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SHARE_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const GUIDE_ID = "11111111-1111-4111-8111-111111111111";

function sampleSaved(): SavedPrepPack {
  return {
    id: PACK_ID,
    role_id: "frontend-engineer",
    role_label: "Frontend engineer",
    skill_count: 1,
    guide_count: 1,
    created_at: "2026-11-16T00:00:00.000Z",
    updated_at: "2026-11-16T00:00:00.000Z",
    skills: [{ name: "React", source: "role_focus" }],
    guides: [
      {
        id: GUIDE_ID,
        company: "Acme",
        role: "Frontend Engineer",
        level: "L4",
        difficulty: "medium",
        rounds: 3,
        avg_rating: 4,
        price_inr: 499,
        href: `/interview-vault/${GUIDE_ID}`,
        why: ["Role match: Frontend engineer"],
        score: 18,
      },
    ],
    checklist: [{ id: "general-0", round: "General", text: "Write three questions." }],
    estimate_notice: "Estimates only.",
  };
}

describe("prep pack share tokens", () => {
  it("generates unguessable tokens and stores only a hash", () => {
    const first = generatePrepPackShareToken(() => Buffer.alloc(32, 1));
    const second = generatePrepPackShareToken(() => Buffer.alloc(32, 2));
    assert.notEqual(first.token, second.token);
    assert.equal(first.tokenHash.length, 64);
    assert.equal(first.tokenHash, hashPrepPackShareToken(first.token));
    assert.equal(shareTokenHashesEqual(first.tokenHash, first.tokenHash), true);
    assert.equal(shareTokenHashesEqual(first.tokenHash, second.tokenHash), false);
    assert.equal(isPlausibleShareToken(first.token), true);
    assert.equal(isPlausibleShareToken("short"), false);
  });

  it("exposes only derived fields on the public share payload", () => {
    const publicPack = toPublicSharedPrepPack(sampleSaved());
    assert.equal(publicShareContainsPrivateKey(publicPack), null);
    assert.equal("user_id" in publicPack, false);
    assert.equal("estimateNotice" in publicPack, true);
    assert.deepEqual(publicPack.role, { id: "frontend-engineer", label: "Frontend engineer" });
    assert.equal(publicPack.guides[0]?.href, `/interview-vault/${GUIDE_ID}`);
    const json = JSON.stringify(publicPack);
    assert.doesNotMatch(json, /questions_html/);
    assert.doesNotMatch(json, /tips_html/);
    assert.doesNotMatch(json, /jobDescription|job_description/);
    assert.doesNotMatch(json, /token_hash|"token"/);
  });
});

describe("prep pack share handlers", () => {
  it("creates a share link and returns the raw token once", async () => {
    const response = await handlePrepPackShareCreate(PACK_ID, {
      create: async () => ({
        id: SHARE_ID,
        pack_id: PACK_ID,
        owner_id: "user-1",
        created_at: "2026-11-16T00:00:00.000Z",
        expires_at: "2027-02-14T00:00:00.000Z",
        revoked_at: null,
        token: "tok_example_token_value_aaaaaaaaaaaa",
        urlPath: "/s/prep/tok_example_token_value_aaaaaaaaaaaa",
      }),
    });
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.share.token, "tok_example_token_value_aaaaaaaaaaaa");
    assert.equal(body.share.urlPath.startsWith("/s/prep/"), true);
    assert.equal("token_hash" in body.share, false);
  });

  it("revokes a share link", async () => {
    const response = await handlePrepPackShareRevoke(SHARE_ID, {
      revoke: async () => ({
        id: SHARE_ID,
        pack_id: PACK_ID,
        owner_id: "user-1",
        created_at: "2026-11-16T00:00:00.000Z",
        expires_at: "2027-02-14T00:00:00.000Z",
        revoked_at: "2026-11-16T01:00:00.000Z",
      }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.share.revokedAt, "2026-11-16T01:00:00.000Z");
  });

  it("returns 404 for revoked or missing public shares without private fields", async () => {
    const missing = await handlePrepPackShareResolve("missing-token-abcdefghijklmnopqrstuv", {
      resolve: async () => null,
    });
    assert.equal(missing.status, 404);
    const missingBody = await missing.json();
    assert.equal(missingBody.ok, false);
    assert.equal(publicShareContainsPrivateKey(missingBody), null);

    const publicPack = toPublicSharedPrepPack(sampleSaved());
    const ok = await handlePrepPackShareResolve("valid-token-abcdefghijklmnopqrstuvwxyz12", {
      resolve: async () => publicPack,
    });
    assert.equal(ok.status, 200);
    const okBody = await ok.json();
    assert.equal(okBody.ok, true);
    assert.equal(publicShareContainsPrivateKey(okBody.pack), null);
    assert.doesNotMatch(JSON.stringify(okBody), /user_id|questions_html|jobDescription/);
  });
});
