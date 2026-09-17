import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session-server";
import { recordConsentLog } from "@/lib/consent-log-server";
import { ipCountryFromHeaders, parseConsentLogBody } from "@/lib/consent-log";
import { checkRateLimit } from "@/lib/hidden-opportunities/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseConsentLogBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const rate = checkRateLimit(`consent:${parsed.anonymousId}`, { limit: 30, windowMs: 60_000 });
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
    );
  }

  try {
    const user = await getSessionUser(request);
    const result = await recordConsentLog({
      userId: user?.id ?? null,
      anonymousId: parsed.anonymousId,
      categories: parsed.categories,
      policyVersion: parsed.policyVersion,
      ipCountry: ipCountryFromHeaders(request.headers),
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Consent log failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
