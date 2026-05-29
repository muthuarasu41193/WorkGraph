import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth/session-server";
import { workgraphBffFetch } from "../../../../lib/workgraph-bff";
import { workgraphApiEnabled } from "../../../../lib/workgraph-api";
import type { WalletSummary, WalletTransaction } from "../../../../packages/shared/types/phase3";

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
    const [summary, txs] = await Promise.all([
      workgraphBffFetch<WalletSummary>("/wallet/summary", { request }),
      workgraphBffFetch<{ transactions: WalletTransaction[] }>("/wallet/transactions", { request }),
    ]);
    return NextResponse.json({ ...summary, transactions: txs.transactions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Wallet load failed";
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
    const body = (await request.json()) as { amount_cents?: number };
    const summary = await workgraphBffFetch<WalletSummary>("/wallet/payout", {
      method: "POST",
      request,
      body: JSON.stringify({ amount_cents: body.amount_cents }),
    });
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payout request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
