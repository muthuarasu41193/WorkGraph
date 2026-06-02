import { NextResponse } from "next/server";
import {
  ApplicationsApiError,
  deleteApplicationForUser,
  updateApplicationForUser,
} from "@/lib/applications-server";
import type { ApplicationUpdate } from "@/lib/applications";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as ApplicationUpdate;
    const application = await updateApplicationForUser(id, body);
    return NextResponse.json({ ok: true, application });
  } catch (err) {
    if (err instanceof ApplicationsApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to update application";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteApplicationForUser(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ApplicationsApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to delete application";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
