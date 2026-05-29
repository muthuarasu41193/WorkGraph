import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../../../../lib/auth/session-server";
import { workgraphBffFetch } from "../../../../../../../lib/workgraph-bff";
import { workgraphApiEnabled } from "../../../../../../../lib/workgraph-api";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ postId: string }> };

export async function POST(request: Request, { params }: Params) {
  if (!workgraphApiEnabled()) {
    return NextResponse.json({ error: "WORKGRAPH_API_URL is not configured" }, { status: 503 });
  }

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;

  try {
    const body = await request.json();
    const data = await workgraphBffFetch(`/community/posts/${postId}/vote`, {
      method: "POST",
      request,
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Vote failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
