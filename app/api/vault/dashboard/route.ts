import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session-server";
import { VaultApiError, getSellerDashboard, getSellerDraft, requestVaultWithdrawal } from "@/lib/vault-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const [dashboard, draft] = await Promise.all([
      getSellerDashboard(user.id),
      getSellerDraft(user.id),
    ]);
    return NextResponse.json({ ok: true, dashboard, draft });
  } catch (err) {
    if (err instanceof VaultApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to load dashboard";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = (await request.json()) as { action?: string };
    if (body.action !== "withdraw") {
      return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
    }
    const result = await requestVaultWithdrawal(user.id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof VaultApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Withdrawal request failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
