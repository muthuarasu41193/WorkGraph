import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth/session-server";
import { workgraphBffFetch } from "../../../../lib/workgraph-bff";
import { workgraphApiEnabled } from "../../../../lib/workgraph-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!workgraphApiEnabled()) {
    return NextResponse.json({ error: "WORKGRAPH_API_URL is not configured" }, { status: 503 });
  }

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await workgraphBffFetch<{ profile: Record<string, unknown> }>("/profile/me", { request });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Profile load failed";
    const status = message.includes("404") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: Request) {
  if (!workgraphApiEnabled()) {
    return NextResponse.json({ error: "WORKGRAPH_API_URL is not configured" }, { status: 503 });
  }

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = await workgraphBffFetch<{ profile: Record<string, unknown> }>("/profile/me", {
      method: "PUT",
      request,
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Profile save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
