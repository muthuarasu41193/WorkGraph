import { NextResponse } from "next/server";

import { handleAccountExport } from "@/lib/account/handlers";
import { ACCOUNT_EXPORT_LIMIT, ACCOUNT_RATE_WINDOW_MS } from "@/lib/account/messages";
import { createSupabaseAccountStore } from "@/lib/account/store";
import { getSessionUser } from "@/lib/auth/session-server";
import { checkRateLimit } from "@/lib/hidden-opportunities/rate-limit";
import { resolveAuthenticatedUserId } from "@/lib/security/session-identity";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getSessionUser(request);
  const userId = resolveAuthenticatedUserId(session);
  const admin = createSupabaseAdminClient();
  const result = await handleAccountExport({
    userId,
    store: admin ? createSupabaseAccountStore(admin) : null,
    rateLimit: (key) => checkRateLimit(key, { limit: ACCOUNT_EXPORT_LIMIT, windowMs: ACCOUNT_RATE_WINDOW_MS }),
  });
  return NextResponse.json(result.body, { status: result.status, headers: result.headers });
}
