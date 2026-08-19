import { NextResponse } from "next/server";
import { VaultApiError, purchaseExperience } from "@/lib/vault-server";
import { logRouteError } from "@/lib/security/log";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const result = await purchaseExperience(id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof VaultApiError) {
      return NextResponse.json(
        { ok: false, unlocked: false, error: err.message },
        { status: err.status },
      );
    }
    logRouteError("vault/purchase", err);
    return NextResponse.json(
      { ok: false, unlocked: false, error: "Purchase could not be completed." },
      { status: 500 },
    );
  }
}
