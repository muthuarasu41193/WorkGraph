import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session-server";
import { isAdminEmail, isAdminListConfigured } from "@/lib/metrics/admin";
import { logRouteError } from "@/lib/security/log";
import { authorizeVaultRefundAdminTransition } from "@/lib/vault/report-auth";
import { VaultApiError, adminUpdateVaultRefundStatus } from "@/lib/vault-server";
import { vaultAdminRefundStatusSchema } from "@/lib/validation/vault";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Admin triage for refund requests.
 * Status may become approved/denied/refunded, but no payment-provider refund runs here.
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getSessionUser();
    const auth = authorizeVaultRefundAdminTransition({
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
    const parsed = vaultAdminRefundStatusSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid refund status." }, { status: 400 });
    }

    const refund = await adminUpdateVaultRefundStatus({
      requestId: id,
      status: parsed.data.status,
      adminNote: parsed.data.admin_note,
      actorUserId: user.id,
    });

    return NextResponse.json({
      ok: true,
      refund,
      processing_mode: "manual",
      note:
        "Status updated only. No automatic refund or earnings change was executed. Depends on Milestone D for payment-provider refunds.",
    });
  } catch (err) {
    if (err instanceof VaultApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    logRouteError("vault/admin-refund", err);
    return NextResponse.json({ ok: false, error: "Could not update refund request." }, { status: 500 });
  }
}
