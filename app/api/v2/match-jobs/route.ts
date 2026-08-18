import { NextResponse } from "next/server";
import { isValidationError, matchJobsBodySchema, parseJsonBody, publicErrorResponse } from "../../../../lib/validation";
import { matchJobsViaApi, workgraphApiEnabled } from "../../../../lib/workgraph-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!workgraphApiEnabled()) {
    return NextResponse.json(
      { error: "WORKGRAPH_API_URL is not configured" },
      { status: 503 },
    );
  }

  try {
    const body = await parseJsonBody(request, matchJobsBodySchema);
    const result = await matchJobsViaApi(body.resume_text, body.top_k ?? 20);
    return NextResponse.json({ ...result, source: "workgraph-api" });
  } catch (err) {
    if (isValidationError(err)) {
      return publicErrorResponse(err, { fallback: "Invalid request." });
    }
    return publicErrorResponse(err, { fallback: "Could not match jobs. Please try again." });
  }
}
