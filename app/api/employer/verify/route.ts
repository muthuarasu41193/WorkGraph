import { NextResponse } from "next/server";
import {
  EmployerApiError,
  adminSetEmployerVerification,
  requestEmployerVerification,
} from "@/lib/employer/employer-server";

export const dynamic = "force-dynamic";

function adminSecretOk(request: Request): boolean {
  const secret =
    process.env.EMPLOYER_ADMIN_SECRET?.trim() || process.env.CRON_SECRET?.trim() || "";
  if (!secret) return false;
  const header = request.headers.get("x-admin-secret") ?? request.headers.get("authorization");
  if (!header) return false;
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  return token === secret;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: string;
      employerId?: string;
    };

    if (body.action === "approve" || body.action === "reject") {
      if (!adminSecretOk(request)) {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
      }
      if (!body.employerId) {
        return NextResponse.json({ ok: false, error: "employerId required" }, { status: 400 });
      }
      const profile = await adminSetEmployerVerification(
        body.employerId,
        body.action === "approve" ? "approve" : "reject",
      );
      return NextResponse.json({ ok: true, profile });
    }

    const profile = await requestEmployerVerification();
    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    if (err instanceof EmployerApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
