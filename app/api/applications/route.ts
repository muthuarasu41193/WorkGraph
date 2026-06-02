import { NextResponse } from "next/server";
import {
  ApplicationsApiError,
  createApplicationForUser,
  listApplicationsForUser,
} from "@/lib/applications-server";
import type { ApplicationInsert } from "@/lib/applications";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const applications = await listApplicationsForUser();
    return NextResponse.json({ ok: true, applications });
  } catch (err) {
    if (err instanceof ApplicationsApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to load applications";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ApplicationInsert;
    const application = await createApplicationForUser(body);
    return NextResponse.json({ ok: true, application }, { status: 201 });
  } catch (err) {
    if (err instanceof ApplicationsApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to create application";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
