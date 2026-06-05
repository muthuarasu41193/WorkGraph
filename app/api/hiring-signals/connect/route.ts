import { NextResponse } from "next/server";
import {
  connectToHiringSignal,
  listSeekerConnections,
} from "@/lib/employer/hiring-signals-server";
import { EmployerApiError } from "@/lib/employer/employer-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const connections = await listSeekerConnections();
    return NextResponse.json({ ok: true, connections });
  } catch (err) {
    if (err instanceof EmployerApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to load connections";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { signalId?: string; connectionNote?: string };
    if (!body.signalId) {
      return NextResponse.json({ ok: false, error: "signalId required" }, { status: 400 });
    }
    const connection = await connectToHiringSignal(
      body.signalId,
      body.connectionNote ?? "",
    );
    return NextResponse.json({ ok: true, connection }, { status: 201 });
  } catch (err) {
    if (err instanceof EmployerApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to connect";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
