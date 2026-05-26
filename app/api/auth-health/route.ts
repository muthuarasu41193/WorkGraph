import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Diagnostic: GET /api/auth-health
 * Verifies Supabase env + Auth API reachability from the deployment.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anon) {
    return NextResponse.json(
      {
        ok: false,
        step: "env",
        message: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
      { status: 500 }
    );
  }

  let host = url;
  try {
    host = new URL(url).hostname;
  } catch {
    /* keep raw */
  }

  let authReachable = false;
  let authError: string | null = null;

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, {
      headers: { apikey: anon },
      cache: "no-store",
    });
    authReachable = res.ok;
    if (!res.ok) authError = `HTTP ${res.status}`;
  } catch (e) {
    authError = e instanceof Error ? e.message : "auth_health_failed";
  }

  let profilesReadable = false;
  let profilesError: string | null = null;

  const supabase = createClient(url, anon, {
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });

  const { error: profilesHeadError } = await supabase.from("profiles").select("id", { head: true, count: "exact" });
  if (profilesHeadError) {
    profilesError = profilesHeadError.message;
  } else {
    profilesReadable = true;
  }

  const ok = authReachable && Boolean(serviceRole);

  return NextResponse.json({
    ok,
    supabaseHost: host,
    authReachable,
    authError,
    hasServiceRoleKey: Boolean(serviceRole),
    profilesTableReadable: profilesReadable,
    profilesError,
    hint: !serviceRole
      ? "Add SUPABASE_SERVICE_ROLE_KEY on Vercel for resume upload + profile save APIs."
      : !authReachable
        ? "Auth API unreachable from this deployment — check Supabase project status and URL."
        : profilesError
          ? "Run supabase/migrations/20260519120000_profiles_auth.sql on your Supabase project."
          : "Auth config looks reachable. Ensure Supabase → Authentication → URL Configuration includes https://workgraph-landing.vercel.app/auth/callback",
  });
}
