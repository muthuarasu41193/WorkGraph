import { NextResponse } from "next/server";

import { sendTestDigestForUser } from "@/lib/alerts/digest";
import { getSessionUser } from "@/lib/auth/session-server";
import { checkRateLimit } from "@/lib/hidden-opportunities/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/** One test digest per hour per account. */
const TEST_DIGEST_LIMIT = 1;
const TEST_DIGEST_WINDOW_MS = 60 * 60 * 1000;

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(`alert-test-digest:${user.id}`, {
    limit: TEST_DIGEST_LIMIT,
    windowMs: TEST_DIGEST_WINDOW_MS,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: "You can send one test digest per hour. Try again later." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
    );
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Email digests are not configured right now." },
      { status: 503 },
    );
  }

  try {
    const result = await sendTestDigestForUser(admin, user.id);
    if (!result.sent) {
      const message =
        result.reason === "no_alerts"
          ? "Save an active alert first (daily or weekly)."
          : result.reason === "no_matches"
            ? "No matching jobs in the current window, so nothing was emailed."
            : result.reason === "no_email"
              ? "We could not find an email on your account."
              : "Could not send a test digest. Please try again.";
      return NextResponse.json({ ok: false, error: message, jobCount: result.jobCount }, { status: 400 });
    }
    return NextResponse.json({ ok: true, jobCount: result.jobCount });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not send a test digest. Please try again." },
      { status: 500 },
    );
  }
}
