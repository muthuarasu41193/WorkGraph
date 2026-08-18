import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth/session-server";
import {
  isValidationError,
  parseJsonBody,
  profileUpsertSchema,
  publicErrorResponse,
} from "../../../../lib/validation";
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
    return publicErrorResponse(err, { fallback: "Could not load your profile. Please try again." });
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
    const body = await parseJsonBody(request, profileUpsertSchema);
    const data = await workgraphBffFetch<{ profile: Record<string, unknown> }>("/profile/me", {
      method: "PUT",
      request,
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (err) {
    if (isValidationError(err)) {
      return publicErrorResponse(err, { fallback: "Invalid profile data." });
    }
    return publicErrorResponse(err, { fallback: "Could not save your profile. Please try again." });
  }
}
