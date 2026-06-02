import { NextResponse } from "next/server";
import {
  VaultApiError,
  getExperienceView,
  updateExperienceForSeller,
} from "@/lib/vault-server";
import type { VaultExperienceInsert } from "@/lib/vault";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const view = await getExperienceView(id);
    if (!view) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, ...view });
  } catch (err) {
    if (err instanceof VaultApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to load experience";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as VaultExperienceInsert & { status?: "draft" | "published" | "archived" };
    const experience = await updateExperienceForSeller(id, body);
    return NextResponse.json({ ok: true, experience });
  } catch (err) {
    if (err instanceof VaultApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to update experience";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
