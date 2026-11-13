import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session-server";
import { isAdminEmail, isAdminListConfigured } from "@/lib/metrics/admin";
import { logRouteError } from "@/lib/security/log";
import { authorizeVaultReportStatusUpdate } from "@/lib/vault/report-auth";
import { VaultApiError, adminUpdateVaultGuideReportStatus } from "@/lib/vault-server";
import { vaultAdminReportStatusSchema } from "@/lib/validation/vault";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** Admin-only report status update. Non-admins receive 404. */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getSessionUser();
    const auth = authorizeVaultReportStatusUpdate({
      actorEmail: user?.email,
      adminEmailsConfigured: isAdminListConfigured(),
      isAdmin: isAdminEmail(user?.email),
    });
    if (!auth.allowed) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }
    if (!user) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const { id } = await context.params;
    const json = await request.json().catch(() => null);
    const parsed = vaultAdminReportStatusSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid report status." }, { status: 400 });
    }

    const report = await adminUpdateVaultGuideReportStatus({
      reportId: id,
      status: parsed.data.status,
      actorUserId: user.id,
    });

    return NextResponse.json({
      ok: true,
      report,
      note:
        parsed.data.status === "removed"
          ? "Guide removed from Vault browse. Purchaser refunds are handled separately via refund requests (manual until Milestone D)."
          : undefined,
    });
  } catch (err) {
    if (err instanceof VaultApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    logRouteError("vault/admin-report", err);
    return NextResponse.json({ ok: false, error: "Could not update report." }, { status: 500 });
  }
}
