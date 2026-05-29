import { NextResponse } from "next/server";
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
    const body = (await request.json()) as { resume_text?: string; top_k?: number };
    const resumeText = body.resume_text?.trim();
    if (!resumeText || resumeText.length < 80) {
      return NextResponse.json(
        { error: "resume_text must be at least 80 characters" },
        { status: 400 },
      );
    }
    const result = await matchJobsViaApi(resumeText, body.top_k ?? 20);
    return NextResponse.json({ ...result, source: "workgraph-api" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Match failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
