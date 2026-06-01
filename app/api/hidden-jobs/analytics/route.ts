import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session-server";
import { recordHiddenJobAnalytics } from "@/lib/hidden-opportunities/analytics-server";
import { checkRateLimit, clientIp } from "@/lib/hidden-opportunities/rate-limit";
import { parseAnalyticsBody } from "@/lib/hidden-opportunities/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rate = checkRateLimit(`hidden-jobs:analytics:${ip}`, { limit: 120 });
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseAnalyticsBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  try {
    const user = await getSessionUser(request);
    const result = await recordHiddenJobAnalytics(user?.id ?? null, parsed);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analytics failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
