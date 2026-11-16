import { NextResponse } from "next/server";

import { logRouteError } from "@/lib/security/log";
import { VaultApiError, confirmExperienceContent } from "@/lib/vault-server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** Owner-only: mark a published guide as currently accurate. */
export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const experience = await confirmExperienceContent(id);
    return NextResponse.json({
      ok: true,
      experience,
      message: "Guide marked as current.",
    });
  } catch (err) {
    if (err instanceof VaultApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    logRouteError("vault/confirm", err);
    return NextResponse.json({ ok: false, error: "Could not update this guide." }, { status: 500 });
  }
}
