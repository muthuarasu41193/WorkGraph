import { NextResponse } from "next/server";
import { isCommunityJobsAdminEmail, isCommunityJobsAdminListConfigured } from "../../../lib/community-admin";
import { syncCommunityJobsViaSupabase } from "../../../lib/community-sync";
import { getBearerToken, getSupabaseSessionUser } from "../../../lib/route-auth";

export const dynamic = "force-dynamic";

function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const bearer = getBearerToken(request);
  return bearer === secret;
}

async function runSyncResponse(trigger: "cron" | "admin") {
  try {
    const result = await syncCommunityJobsViaSupabase();
    return NextResponse.json({
      ok: true,
      trigger,
      syncedAt: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    return NextResponse.json({ ok: false, trigger, message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  return runSyncResponse("cron");
}

/** Manual sync for signed-in users whose email is listed in COMMUNITY_JOBS_ADMIN_EMAILS. */
export async function POST() {
  const {
    data: { user },
    error,
  } = await getSupabaseSessionUser();
  if (error || !user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  if (!isCommunityJobsAdminListConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Admin sync is disabled: set COMMUNITY_JOBS_ADMIN_EMAILS on the server (comma-separated emails) to allow manual sync.",
      },
      { status: 503 }
    );
  }
  if (!isCommunityJobsAdminEmail(user.email)) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  return runSyncResponse("admin");
}
