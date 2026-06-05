import { NextResponse } from "next/server";
import {
  EmployerApiError,
  listConnectionsForEmployer,
  updateConnectionStage,
} from "@/lib/employer/employer-server";
import { isConnectionStage } from "@/lib/employer/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const signalId = new URL(request.url).searchParams.get("signalId") ?? undefined;
    const connections = await listConnectionsForEmployer(signalId);
    return NextResponse.json({ ok: true, connections });
  } catch (err) {
    if (err instanceof EmployerApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to load inbox";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      connectionId?: string;
      stage?: string;
      employer_reply?: string;
    };
    if (!body.connectionId) {
      return NextResponse.json({ ok: false, error: "connectionId required" }, { status: 400 });
    }
    if (!body.stage || !isConnectionStage(body.stage)) {
      return NextResponse.json({ ok: false, error: "Valid stage required" }, { status: 400 });
    }
    const connection = await updateConnectionStage(
      body.connectionId,
      body.stage,
      body.employer_reply,
    );
    return NextResponse.json({ ok: true, connection });
  } catch (err) {
    if (err instanceof EmployerApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to update connection";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
