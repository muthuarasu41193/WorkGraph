import { NextResponse } from "next/server";
import { VaultApiError, purchaseExperience } from "@/lib/vault-server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const result = await purchaseExperience(id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof VaultApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Purchase failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
