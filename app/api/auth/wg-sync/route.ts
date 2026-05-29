import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth/session-server";
import { workgraphBffFetch } from "../../../../lib/workgraph-bff";
import { workgraphApiEnabled } from "../../../../lib/workgraph-api";

export const dynamic = "force-dynamic";

/** Upsert wg_users row in self-hosted Postgres after sign-in. */
export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!workgraphApiEnabled()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await workgraphBffFetch("/wallet/dashboard", { method: "GET", request });
    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
