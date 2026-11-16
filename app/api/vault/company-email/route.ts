import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session-server";
import {
  CompanyEmailApiError,
  confirmCompanyEmailChallenge,
  getCompanyEmailStatus,
  startCompanyEmailChallenge,
  withdrawCompanyEmailClaim,
} from "@/lib/vault-company-email-server";
import { sanitizeCompanyEmailResponse } from "@/lib/vault-company-email";

export const dynamic = "force-dynamic";

type ActionBody = {
  action?: string;
  email?: unknown;
  code?: unknown;
};

function statusForStep(step: unknown, ok: boolean): number {
  if (ok) return 200;
  if (step === "expired" || step === "too_many_attempts") return 400;
  if (step === "enter_code") return 400;
  return 400;
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const status = await getCompanyEmailStatus(user.id);
    return NextResponse.json(
      sanitizeCompanyEmailResponse({
        ok: true,
        ...status,
      }),
    );
  } catch (err) {
    if (err instanceof CompanyEmailApiError) {
      return NextResponse.json(
        sanitizeCompanyEmailResponse({ ok: false, error: err.message }),
        { status: err.status },
      );
    }
    return NextResponse.json(
      sanitizeCompanyEmailResponse({ ok: false, error: "Failed to load confirmation status" }),
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    let body: ActionBody;
    try {
      body = (await request.json()) as ActionBody;
    } catch {
      return NextResponse.json(
        sanitizeCompanyEmailResponse({ ok: false, error: "Invalid JSON body" }),
        { status: 400 },
      );
    }

    const action = typeof body.action === "string" ? body.action : "";

    if (action === "start") {
      const result = await startCompanyEmailChallenge(user.id, body.email);
      return NextResponse.json(result);
    }

    if (action === "confirm") {
      const result = await confirmCompanyEmailChallenge(user.id, body.email, body.code);
      const ok = result.ok === true;
      return NextResponse.json(result, { status: statusForStep(result.step, ok) });
    }

    if (action === "withdraw") {
      const result = await withdrawCompanyEmailClaim(user.id);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      sanitizeCompanyEmailResponse({ ok: false, error: "Unknown action" }),
      { status: 400 },
    );
  } catch (err) {
    if (err instanceof CompanyEmailApiError) {
      return NextResponse.json(
        sanitizeCompanyEmailResponse({ ok: false, error: err.message }),
        { status: err.status },
      );
    }
    return NextResponse.json(
      sanitizeCompanyEmailResponse({ ok: false, error: "Confirmation request failed" }),
      { status: 500 },
    );
  }
}
