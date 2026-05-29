import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth/session-server";
import { workgraphBffFetch } from "../../../../lib/workgraph-bff";
import { workgraphApiEnabled } from "../../../../lib/workgraph-api";
import type { DashboardSnapshot, WalletSummary } from "../../../../packages/shared/types/phase3";

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
    const data = await workgraphBffFetch<{
      dashboard: DashboardSnapshot;
      wallet: WalletSummary;
    }>("/wallet/dashboard", { request });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dashboard load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
