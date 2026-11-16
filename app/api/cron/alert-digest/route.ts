import { NextResponse } from "next/server";

import { runAlertDigest } from "@/lib/alerts/digest";
import { getBearerToken } from "@/lib/route-auth";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const bearer = getBearerToken(request);
  return bearer === secret;
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, message: "Supabase admin client is not configured" },
      { status: 503 },
    );
  }

  try {
    const result = await runAlertDigest(admin);
    return NextResponse.json({
      ok: true,
      trigger: "cron",
      ranAt: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Digest failed";
    return NextResponse.json({ ok: false, trigger: "cron", message }, { status: 500 });
  }
}
