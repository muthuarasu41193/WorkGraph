import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session-server";
import { checkRateLimit, clientIp } from "@/lib/hidden-opportunities/rate-limit";
import { logRouteError } from "@/lib/security/log";
import { authorizeVaultReportSubmit } from "@/lib/vault/report-auth";
import { VAULT_REPORT_REASONS_UI } from "@/lib/vault/reports";
import { VaultApiError, submitVaultGuideReport } from "@/lib/vault-server";
import { vaultReportBodySchema } from "@/lib/validation/vault";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Signed-in report flow only. Anonymous reporting is not allowed so RLS can
 * scope rows to reporter_id and rate limits can key on the authenticated user.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getSessionUser();
    const auth = authorizeVaultReportSubmit({ userId: user?.id });
    if (!auth.allowed) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const ip = clientIp(request);
    const rate = checkRateLimit(`vault-report:${user!.id}:${ip}`, { limit: 8, windowMs: 60_000 });
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many reports. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
      );
    }

    const { id } = await context.params;
    const json = await request.json().catch(() => null);
    const parsed = vaultReportBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Choose a valid report reason.", reasons: VAULT_REPORT_REASONS_UI },
        { status: 400 },
      );
    }

    const report = await submitVaultGuideReport({
      experienceId: id,
      reason: parsed.data.reason,
      details: parsed.data.details,
    });

    return NextResponse.json({
      ok: true,
      reportId: report.id,
      message: "Report received. A person can review it.",
    });
  } catch (err) {
    if (err instanceof VaultApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    logRouteError("vault/report", err);
    return NextResponse.json({ ok: false, error: "Could not submit report." }, { status: 500 });
  }
}
