import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session-server";
import { logRouteError } from "@/lib/security/log";
import { VaultApiError, respondToVaultRefundRequest } from "@/lib/vault-server";
import { vaultRefundContributorResponseSchema } from "@/lib/validation/vault";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** Contributor response on an open refund request for their guide. */
export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const json = await request.json().catch(() => null);
    const parsed = vaultRefundContributorResponseSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Response text is required." }, { status: 400 });
    }

    const refund = await respondToVaultRefundRequest({
      requestId: id,
      response: parsed.data.response,
    });

    return NextResponse.json({ ok: true, refund });
  } catch (err) {
    if (err instanceof VaultApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    logRouteError("vault/refund-respond", err);
    return NextResponse.json({ ok: false, error: "Could not save response." }, { status: 500 });
  }
}
