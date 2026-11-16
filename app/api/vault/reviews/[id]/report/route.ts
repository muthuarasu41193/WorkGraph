import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session-server";
import { checkRateLimit, clientIp } from "@/lib/hidden-opportunities/rate-limit";
import { logRouteError } from "@/lib/security/log";
import { authorizeVaultReviewReportSubmit } from "@/lib/vault/report-auth";
import { VaultApiError, submitVaultReviewReport } from "@/lib/vault-server";
import { vaultReviewReportBodySchema } from "@/lib/validation/vault";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getSessionUser();
    const auth = authorizeVaultReviewReportSubmit({ userId: user?.id });
    if (!auth.allowed) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const ip = clientIp(request);
    const rate = checkRateLimit(`vault-review-report:${user!.id}:${ip}`, { limit: 8, windowMs: 60_000 });
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many reports. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
      );
    }

    const { id } = await context.params;
    const json = await request.json().catch(() => null);
    const parsed = vaultReviewReportBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Choose a valid report reason." }, { status: 400 });
    }

    const report = await submitVaultReviewReport({
      reviewId: id,
      reason: parsed.data.reason,
      details: parsed.data.details,
    });

    return NextResponse.json({
      ok: true,
      reportId: report.id,
      message: "Review report received.",
    });
  } catch (err) {
    if (err instanceof VaultApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    logRouteError("vault/review-report", err);
    return NextResponse.json({ ok: false, error: "Could not submit report." }, { status: 500 });
  }
}
