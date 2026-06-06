import { NextResponse } from "next/server";
import {
  connectToHiringSignal,
  listSeekerConnections,
} from "@/lib/employer/hiring-signals-server";
import { EmployerApiError } from "@/lib/employer/employer-server";
import type { ApplicationInput } from "@/lib/employer/application-snapshot";

export const dynamic = "force-dynamic";

function parseConnectBody(body: Record<string, unknown>): ApplicationInput & { signalId?: string } {
  return {
    signalId: typeof body.signalId === "string" ? body.signalId : undefined,
    connectionNote:
      typeof body.connectionNote === "string"
        ? body.connectionNote
        : typeof body.message === "string"
          ? body.message
          : "",
    resumeUrl: typeof body.resumeUrl === "string" ? body.resumeUrl : null,
    linkedinUrl: typeof body.linkedinUrl === "string" ? body.linkedinUrl : null,
    githubUrl: typeof body.githubUrl === "string" ? body.githubUrl : null,
    websiteUrl: typeof body.websiteUrl === "string" ? body.websiteUrl : null,
    stackoverflowUrl: typeof body.stackoverflowUrl === "string" ? body.stackoverflowUrl : null,
  };
}

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
    const body = parseConnectBody((await request.json()) as Record<string, unknown>);
    if (!body.signalId) {
      return NextResponse.json({ ok: false, error: "signalId required" }, { status: 400 });
    }
    const { signalId, ...applicationInput } = body;
    const connection = await connectToHiringSignal(signalId, applicationInput);
    return NextResponse.json({ ok: true, connection }, { status: 201 });
  } catch (err) {
    if (err instanceof EmployerApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to connect";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
