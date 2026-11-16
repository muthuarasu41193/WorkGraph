import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assertNoLockedVaultFields, projectPublicVaultGuide } from "../public-guide.ts";
import { buildVaultGuideOutline } from "../outline.ts";
import { formatInterviewMonthYear, vaultFreshnessDisplay } from "../freshness.ts";
import {
  authorizeVaultReportStatusUpdate,
  authorizeVaultReportSubmit,
} from "../report-auth.ts";
import {
  isVaultReportReason,
  VAULT_REPORT_REASONS_UI,
  VAULT_REPORT_REASONS,
} from "../reports.ts";
import {
  authorizeVaultRefundRequest,
  canTransitionRefundStatus,
  isWithinRefundWindow,
  VAULT_REFUND_REASONS,
} from "../refunds.ts";
import {
  authorizeVaultReviewWrite,
  validateVaultReviewInput,
} from "../reviews.ts";

describe("V4 report reasons", () => {
  it("exposes inaccessible, misrepresented, outdated, copied, and confidential reasons in UI", () => {
    for (const reason of [
      "inaccessible_after_purchase",
      "materially_misrepresented",
      "inaccurate_or_outdated",
      "copied_from_third_party",
      "confidential_or_personal",
    ] as const) {
      assert.ok(VAULT_REPORT_REASONS.includes(reason));
      assert.ok(VAULT_REPORT_REASONS_UI.includes(reason));
      assert.equal(isVaultReportReason(reason), true);
    }
  });

  it("keeps admin-only status transitions gated", () => {
    assert.equal(authorizeVaultReportSubmit({ userId: null }).allowed, false);
    assert.equal(authorizeVaultReportSubmit({ userId: "u1" }).allowed, true);
    assert.equal(
      authorizeVaultReportStatusUpdate({
        actorEmail: "buyer@example.com",
        adminEmailsConfigured: true,
        isAdmin: false,
      }).allowed,
      false,
    );
    assert.equal(
      authorizeVaultReportStatusUpdate({
        actorEmail: "founder@getworkgraph.com",
        adminEmailsConfigured: true,
        isAdmin: true,
      }).allowed,
      true,
    );
  });
});

describe("V4 review eligibility", () => {
  it("requires a verified purchase and rejects owners", () => {
    const deniedOwner = authorizeVaultReviewWrite({
      userId: "seller",
      sellerId: "seller",
      priceInr: 499,
      purchase: { id: "p1", payment_status: "verified" },
    });
    assert.equal(deniedOwner.allowed, false);

    const deniedPending = authorizeVaultReviewWrite({
      userId: "buyer",
      sellerId: "seller",
      priceInr: 499,
      purchase: { id: "p1", payment_status: "pending" },
    });
    assert.equal(deniedPending.allowed, false);

    const allowed = authorizeVaultReviewWrite({
      userId: "buyer",
      sellerId: "seller",
      priceInr: 499,
      purchase: { id: "p1", payment_status: "verified" },
    });
    assert.equal(allowed.allowed, true);
    if (allowed.allowed) assert.equal(allowed.purchaseId, "p1");
  });

  it("validates rating and blocks offer-outcome probing", () => {
    assert.equal(validateVaultReviewInput({ rating: 6 }).ok, false);
    assert.equal(validateVaultReviewInput({ rating: 5, comment: "Great tips" }).ok, true);
    assert.equal(
      validateVaultReviewInput({ rating: 4, comment: "Did you get an offer from them?" }).ok,
      false,
    );
  });
});

describe("V4 refund authorization", () => {
  const purchase = {
    id: "p1",
    payment_status: "verified",
    created_at: new Date().toISOString(),
  };

  it("allows entitled buyers within the window once", () => {
    const ok = authorizeVaultRefundRequest({
      userId: "buyer",
      sellerId: "seller",
      purchase,
      existingRequest: false,
    });
    assert.equal(ok.allowed, true);
  });

  it("rejects non-buyers, duplicates, and expired windows", () => {
    assert.equal(
      authorizeVaultRefundRequest({
        userId: "seller",
        sellerId: "seller",
        purchase,
        existingRequest: false,
      }).allowed,
      false,
    );
    assert.equal(
      authorizeVaultRefundRequest({
        userId: "buyer",
        sellerId: "seller",
        purchase,
        existingRequest: true,
      }).allowed,
      false,
    );
    assert.equal(
      authorizeVaultRefundRequest({
        userId: "buyer",
        sellerId: "seller",
        purchase: {
          ...purchase,
          created_at: new Date(Date.now() - 40 * 86_400_000).toISOString(),
        },
        existingRequest: false,
        windowDays: 14,
      }).allowed,
      false,
    );
  });

  it("limits admin status transitions and keeps refund reasons closed", () => {
    assert.deepEqual([...VAULT_REFUND_REASONS], [
      "inaccessible_after_purchase",
      "materially_misrepresented",
    ]);
    assert.equal(canTransitionRefundStatus("open", "approved"), true);
    assert.equal(canTransitionRefundStatus("refunded", "open"), false);
    assert.equal(
      isWithinRefundWindow({
        purchasedAt: new Date().toISOString(),
        windowDays: 14,
      }),
      true,
    );
  });
});

describe("V4 preview and outline do not leak locked content", () => {
  it("builds title-only outline and month/year interview dates", () => {
    const outline = buildVaultGuideOutline({
      interview_round: "System design",
      rounds_data: [{ name: "Phone screen", description: "SECRET BODY", duration: "45m" }],
      questions_html: "<p>secret question</p>",
      tips_html: "<p>secret tip</p>",
    });
    const joined = JSON.stringify(outline);
    assert.equal(joined.includes("SECRET BODY"), false);
    assert.equal(joined.includes("secret question"), false);
    assert.equal(joined.includes("secret tip"), false);
    assert.ok(outline.some((s) => s.title === "Phone screen"));
    assert.ok(outline.some((s) => s.title === "Questions asked"));
    assert.equal(formatInterviewMonthYear("2026-03-15"), "March 2026");
  });

  it("public projection never includes locked fields", () => {
    const projection = projectPublicVaultGuide({
      id: "g1",
      company: "Acme",
      role: "Engineer",
      interview_round: "Onsite",
      content_confirmed_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      roundNames: ["Round 1"],
    });
    assert.ok(projection);
    assertNoLockedVaultFields(projection);
    assert.equal("questions_html" in (projection as object), false);
    const freshness = vaultFreshnessDisplay({
      contentConfirmedAt: new Date().toISOString(),
    });
    assert.equal(freshness.stale, false);
  });
});
