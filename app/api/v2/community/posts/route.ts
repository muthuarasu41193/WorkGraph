import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../../lib/auth/session-server";
import { workgraphBffFetch } from "../../../../../lib/workgraph-bff";
import { workgraphApiEnabled } from "../../../../../lib/workgraph-api";
import type { CommunityPost } from "../../../../../packages/shared/types/phase3";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!workgraphApiEnabled()) {
    return NextResponse.json({ error: "WORKGRAPH_API_URL is not configured" }, { status: 503 });
  }

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const postType = searchParams.get("post_type");
  const qs = postType ? `?post_type=${encodeURIComponent(postType)}` : "";

  try {
    const data = await workgraphBffFetch<{ posts: CommunityPost[]; count: number }>(
      `/community/posts${qs}`,
      { request },
    );
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load posts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!workgraphApiEnabled()) {
    return NextResponse.json({ error: "WORKGRAPH_API_URL is not configured" }, { status: 503 });
  }

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = await workgraphBffFetch<{ post: CommunityPost }>("/community/posts", {
      method: "POST",
      request,
      body: JSON.stringify(body),
    });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
