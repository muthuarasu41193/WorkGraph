import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  employerVisibleResumeHref,
  isOwnedResumeStoragePath,
  isPublicResumeObjectUrl,
  ownedResumeTextForMatch,
  ownerResumeFilePath,
  parseResumePathFromPublicUrl,
} from "../resume-access.ts";
import { matchJobsAccess, resolveAuthenticatedUserId, unauthenticatedStatus } from "../session-identity.ts";
import { hasVaultEntitlement, isVaultListingFree, vaultPurchaseUnlocksContent } from "../vault-entitlement.ts";
import { publicVaultListItem, redactVaultExperience, type VaultExperience } from "../../vault.ts";

const OWNER = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";

function sampleExperience(overrides: Partial<VaultExperience> = {}): VaultExperience {
  return {
    id: "exp-1",
    seller_id: OWNER,
    company: "Acme",
    role: "Engineer",
    level: "L4",
    difficulty: "medium",
    rounds: 3,
    result: "offer",
    interview_date: "2026-01-01",
    rounds_data: [{ name: "Phone", description: "Secret system design prompt" }],
    questions_html: "<p>What is your compensation history?</p>",
    tips_html: "<p>Ask the hiring manager for the take-home.</p>",
    price_inr: 499,
    status: "published",
    draft_step: 5,
    view_count: 10,
    sales_count: 2,
    avg_rating: 4.5,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    published_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("P0 ATS identity", () => {
  it("1. unauthenticated ATS request → 401", () => {
    assert.equal(unauthenticatedStatus(resolveAuthenticatedUserId(null, OTHER)), 401);
    assert.equal(resolveAuthenticatedUserId(null, OTHER), null);
  });

  it("2. authenticated ATS request → only own profile", () => {
    const userId = resolveAuthenticatedUserId({ id: OWNER }, null);
    assert.equal(userId, OWNER);
    assert.equal(unauthenticatedStatus(userId), null);
  });

  it("3. attempted ATS user ID substitution → rejected/ignored", () => {
    const userId = resolveAuthenticatedUserId({ id: OWNER }, OTHER);
    assert.equal(userId, OWNER);
    assert.notEqual(userId, OTHER);
  });
});

describe("P0 resume analyze + match-jobs auth", () => {
  it("4. unauthenticated resume analysis → 401", () => {
    assert.equal(unauthenticatedStatus(resolveAuthenticatedUserId(null)), 401);
  });

  it("5. unauthenticated match-jobs → 401", () => {
    assert.equal(matchJobsAccess(null, true).status, 401);
    assert.equal(matchJobsAccess(null, false).status, 401);
  });

  it("6. attempted cross-user access → rejected", () => {
    const userId = resolveAuthenticatedUserId({ id: OWNER }, OTHER);
    assert.equal(userId, OWNER);

    const ownText = "A".repeat(120);
    const foreignText = "B".repeat(120);
    assert.equal(ownedResumeTextForMatch(ownText, foreignText), ownText);
    assert.notEqual(ownedResumeTextForMatch(ownText, foreignText), foreignText);

    const access = matchJobsAccess(userId, true);
    assert.equal(access.status, 200);
    if (access.status === 200) assert.equal(access.userId, OWNER);
  });

  it("match-jobs without WORKGRAPH_API_URL stays 503 after auth", () => {
    assert.equal(matchJobsAccess(OWNER, false).status, 503);
  });
});

describe("P0 resume storage", () => {
  it("7. resume storage is not publicly readable", () => {
    const publicUrl = `https://example.supabase.co/storage/v1/object/public/resumes/${OWNER}/cv.pdf`;
    assert.equal(isPublicResumeObjectUrl(publicUrl), true);
    assert.equal(isPublicResumeObjectUrl(ownerResumeFilePath()), false);
    assert.equal(isPublicResumeObjectUrl(employerVisibleResumeHref({ connectionId: "c1", resumeUrl: publicUrl })), false);
    assert.equal(parseResumePathFromPublicUrl(publicUrl), `${OWNER}/cv.pdf`);
  });

  it("8. legitimate authenticated resume access still works", () => {
    assert.equal(ownerResumeFilePath(), "/api/resume/file");
    assert.equal(isOwnedResumeStoragePath(`${OWNER}/123-resume.pdf`, OWNER), true);
    assert.equal(isOwnedResumeStoragePath(`${OTHER}/123-resume.pdf`, OWNER), false);
    assert.equal(isOwnedResumeStoragePath("../etc/passwd", OWNER), false);
    assert.equal(
      employerVisibleResumeHref({ connectionId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", resumeUrl: "/api/resume/file" }),
      "/api/resume/file?connectionId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    );
    assert.equal(employerVisibleResumeHref({ connectionId: "c1", resumeUrl: null }), null);
  });
});

describe("P0 Interview Vault entitlement", () => {
  it("9. unpaid Vault user cannot access paid content", () => {
    const paid = sampleExperience({ price_inr: 499 });
    assert.equal(isVaultListingFree(paid.price_inr), false);
    assert.equal(
      hasVaultEntitlement({
        viewerId: OTHER,
        sellerId: paid.seller_id,
        priceInr: paid.price_inr,
        purchase: null,
      }),
      false,
    );
    assert.equal(
      hasVaultEntitlement({
        viewerId: OTHER,
        sellerId: paid.seller_id,
        priceInr: paid.price_inr,
        purchase: { payment_status: "pending" },
      }),
      false,
    );
    assert.equal(vaultPurchaseUnlocksContent({ payment_status: "pending" }, 499), false);

    const redacted = redactVaultExperience(paid);
    assert.equal(redacted.questions_html, "");
    assert.equal(redacted.tips_html, "");
    assert.deepEqual(redacted.rounds_data, []);

    const listed = publicVaultListItem(paid);
    assert.ok(listed.preview.length > 0);
    assert.equal(listed.questions_html, "");
    assert.equal(listed.tips_html, "");
    assert.deepEqual(listed.rounds_data, []);
  });

  it("10. legitimate verified entitlement can access paid content", () => {
    const paid = sampleExperience({ price_inr: 499 });
    assert.equal(
      hasVaultEntitlement({
        viewerId: OTHER,
        sellerId: paid.seller_id,
        priceInr: paid.price_inr,
        purchase: { payment_status: "verified" },
      }),
      true,
    );
    assert.equal(vaultPurchaseUnlocksContent({ payment_status: "verified" }, 499), true);
    assert.equal(
      hasVaultEntitlement({
        viewerId: OWNER,
        sellerId: paid.seller_id,
        priceInr: paid.price_inr,
        purchase: null,
      }),
      true,
    );
    assert.equal(
      hasVaultEntitlement({
        viewerId: OTHER,
        sellerId: paid.seller_id,
        priceInr: 0,
        purchase: null,
      }),
      true,
    );
  });
});
