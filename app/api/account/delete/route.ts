import { NextResponse } from "next/server";

import { handleAccountDelete } from "@/lib/account/handlers";
import { ACCOUNT_DELETE_LIMIT, ACCOUNT_RATE_WINDOW_MS } from "@/lib/account/messages";
import { signOutServerSession } from "@/lib/account/sign-out-server";
import { createSupabaseAccountStore } from "@/lib/account/store";
import { getSessionUser } from "@/lib/auth/session-server";
import { checkRateLimit } from "@/lib/hidden-opportunities/rate-limit";
import { resolveAuthenticatedUserId } from "@/lib/security/session-identity";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSessionUser(request);
  const userId = resolveAuthenticatedUserId(session);
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const admin = createSupabaseAdminClient();
  const result = await handleAccountDelete({
    userId,
    body,
    store: admin ? createSupabaseAccountStore(admin) : null,
    rateLimit: (key) => checkRateLimit(key, { limit: ACCOUNT_DELETE_LIMIT, windowMs: ACCOUNT_RATE_WINDOW_MS }),
  });
  if (result.status === 200) {
    await signOutServerSession();
  }
  return NextResponse.json(result.body, { status: result.status, headers: result.headers });
}
