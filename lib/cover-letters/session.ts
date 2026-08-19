import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getBearerToken, getSupabaseSessionUser } from "@/lib/route-auth";
import { resolveAuthenticatedUserId } from "@/lib/security/session-identity";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export type CoverLetterSession =
  | { ok: true; userId: string; supabase: SupabaseClient }
  | { ok: false; response: NextResponse };

/**
 * ATS-score auth: bearer JWT via the admin client, then cookie session.
 * Client-supplied user ids are ignored.
 */
export async function requireCoverLetterSession(request: Request): Promise<CoverLetterSession> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Could not complete this request. Please try again." },
        { status: 500 },
      ),
    };
  }

  let sessionUser: { id: string } | null = null;

  const bearer = getBearerToken(request);
  if (bearer) {
    const {
      data: { user },
      error: jwtError,
    } = await supabase.auth.getUser(bearer);
    if (!jwtError && user) {
      sessionUser = { id: user.id };
    }
  }

  if (!sessionUser) {
    const {
      data: { user },
      error: sessionError,
    } = await getSupabaseSessionUser(request);
    if (!sessionError && user) {
      sessionUser = { id: user.id };
    }
  }

  const userId = resolveAuthenticatedUserId(sessionUser);
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Not authenticated. Please sign in and try again." },
        { status: 401 },
      ),
    };
  }

  return { ok: true, userId, supabase };
}
