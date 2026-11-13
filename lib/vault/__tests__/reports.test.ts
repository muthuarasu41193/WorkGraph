import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isVaultReportReason,
  isVaultReportStatus,
  reportStatusRemovesGuide,
  VAULT_REPORT_REASONS,
  VAULT_REPORT_REASONS_UI,
  VAULT_REPORT_STATUSES,
} from "../reports.ts";
import {
  authorizeVaultReportSubmit,
  authorizeVaultReportStatusUpdate,
} from "../report-auth.ts";

describe("vault report reason/status model", () => {
  it("exposes an extensible reason enum including V4 slots", () => {
    assert.ok(VAULT_REPORT_REASONS.includes("inaccessible_after_purchase"));
    assert.ok(VAULT_REPORT_REASONS.includes("materially_misrepresented"));
    assert.ok(VAULT_REPORT_REASONS_UI.every((r) => isVaultReportReason(r)));
    assert.equal(isVaultReportReason("not-a-reason"), false);
  });

  it("models moderation statuses including removed", () => {
    for (const status of VAULT_REPORT_STATUSES) {
      assert.equal(isVaultReportStatus(status), true);
    }
    assert.equal(reportStatusRemovesGuide("removed"), true);
    assert.equal(reportStatusRemovesGuide("dismissed"), false);
  });
});

describe("vault report authorization", () => {
  it("rejects anonymous report submissions", () => {
    const decision = authorizeVaultReportSubmit({ userId: null });
    assert.equal(decision.allowed, false);
    assert.equal(decision.status, 401);
  });

  it("allows signed-in reporters", () => {
    const decision = authorizeVaultReportSubmit({ userId: "user-1" });
    assert.equal(decision.allowed, true);
  });

  it("rejects non-admin status updates", () => {
    const decision = authorizeVaultReportStatusUpdate({
      actorEmail: "buyer@example.com",
      adminEmailsConfigured: true,
      isAdmin: false,
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.status, 404);
  });

  it("allows admin status updates when ADMIN_EMAILS is configured", () => {
    const decision = authorizeVaultReportStatusUpdate({
      actorEmail: "founder@getworkgraph.com",
      adminEmailsConfigured: true,
      isAdmin: true,
    });
    assert.equal(decision.allowed, true);
  });

  it("denies everyone when admin list is unset", () => {
    const decision = authorizeVaultReportStatusUpdate({
      actorEmail: "founder@getworkgraph.com",
      adminEmailsConfigured: false,
      isAdmin: false,
    });
    assert.equal(decision.allowed, false);
  });
});
