import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getCommunitySyncDiagnosticsEnv } from "../../../lib/community-sync";

export const dynamic = "force-dynamic";

/**
 * Diagnostic: GET /api/community-jobs-health
 * Checks anon read access to community rows in public.jobs and reports sync-related env flags (no secret values).
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const syncEnv = getCommunitySyncDiagnosticsEnv();

  if (!url || !key) {
    return NextResponse.json(
      {
        ok: false,
        step: "env",
        message: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY on this deployment.",
        syncEnv,
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

  const supabase = createClient(url, key, {
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });

  const head = await supabase.from("jobs").select("id", { count: "exact", head: true }).eq("is_community", true);
  const sample = await supabase
    .from("jobs")
    .select("id, title, source, posted_at, kind, classification")
    .eq("is_community", true)
    .order("posted_at", { ascending: false })
    .limit(3);

  const permMsg = (head.error?.message ?? "") + (sample.error?.message ?? "");
  const looksLikeMissingPrivilege =
    /permission denied|42501|PGRST/i.test(permMsg) || head.error?.code === "42501";

  let hint: string;
  if (head.error || sample.error) {
    hint = looksLikeMissingPrivilege
      ? "Database rejected SELECT on public.jobs for community rows. Ensure RLS and GRANTs allow anon/authenticated read where needed, same as the profile community feed."
      : "See headError / sampleError — wrong project URL/key, missing column is_community, or policy mismatch.";
  } else if ((head.count ?? 0) === 0) {
    hint =
      "No community rows yet — run sync (Vercel cron GET /api/sync-community-jobs with CRON_SECRET, or an admin POST) once SUPABASE_SERVICE_ROLE_KEY and ingest are configured.";
  } else if (!syncEnv.env.hasServiceRoleKey) {
    hint =
      "Community rows exist but SUPABASE_SERVICE_ROLE_KEY is missing on this deployment; server-side sync will fail until it is set.";
  } else {
    hint = "Community jobs lane looks reachable for anon clients; cron or admin sync can refresh upstream sources.";
  }

  return NextResponse.json({
    ok: !head.error && !sample.error,
    supabaseHost: host,
    communityJobsCount: head.count,
    headError: head.error?.message ?? null,
    headErrorCode: head.error?.code ?? null,
    sampleRowCount: sample.data?.length ?? 0,
    sampleError: sample.error?.message ?? null,
    samplePreview: sample.data ?? null,
    syncEnv,
    hint,
  });
}
