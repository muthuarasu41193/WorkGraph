import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session-server";
import { checkRateLimit, clientIp } from "@/lib/hidden-opportunities/rate-limit";
import { logRouteError } from "@/lib/security/log";
import { VAULT_REFUND_POLICY_PLACEHOLDER } from "@/lib/vault/refunds";
import { VaultApiError, createVaultRefundRequest } from "@/lib/vault-server";
import { vaultRefundRequestBodySchema } from "@/lib/validation/vault";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** Entitled buyers may file a manual refund request. No payment-provider refund runs here. */
export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Sign in to request a refund." }, { status: 401 });
    }

    const ip = clientIp(request);
    const rate = checkRateLimit(`vault-refund:${user.id}:${ip}`, { limit: 5, windowMs: 60_000 });
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many refund requests. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
      );
    }

    const { id } = await context.params;
    const json = await request.json().catch(() => null);
    const parsed = vaultRefundRequestBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Choose a valid refund reason." }, { status: 400 });
    }

    const refund = await createVaultRefundRequest({
      experienceId: id,
      reason: parsed.data.reason,
      details: parsed.data.details,
    });

    return NextResponse.json(
      {
        ok: true,
        refund,
        processing_mode: "manual",
        policy_notice: VAULT_REFUND_POLICY_PLACEHOLDER,
        message:
          "Refund request recorded for manual review. No automatic refund or earnings change was executed.",
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof VaultApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    logRouteError("vault/refund", err);
    return NextResponse.json({ ok: false, error: "Could not submit refund request." }, { status: 500 });
  }
}
