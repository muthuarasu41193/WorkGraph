import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Diagnostic: open GET /api/jobs-health on your deployed site (or localhost).
 * Shows whether anon requests can see `public.jobs` — same path as the profile dashboard uses.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      {
        ok: false,
        step: "env",
        message: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY on this deployment.",
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

  const head = await supabase.from("jobs").select("id", { count: "exact", head: true });
  const sample = await supabase.from("jobs").select("id, title, source").limit(3);

  const permMsg = (head.error?.message ?? "") + (sample.error?.message ?? "");
  const looksLikeMissingPrivilege =
    /permission denied|42501|PGRST/i.test(permMsg) || head.error?.code === "42501";

  let hint: string;
  if (head.error || sample.error) {
    hint = looksLikeMissingPrivilege
      ? "Database rejected SELECT on public.jobs. Run supabase/migrations/20260205153000_jobs_api_grants.sql on this project (GRANT SELECT to anon, authenticated), then reload schema cache if needed."
      : "See headError / sampleError — wrong project URL/key, missing jobs table, or RLS/policy mismatch.";
  } else if ((head.count ?? 0) === 0) {
    hint =
      "Table is readable but empty — run ingest (GitHub Action or python -m app.main ingest) against this project's Postgres, and confirm Vercel env points at the same Supabase project.";
  } else {
    hint = "Looks healthy — profile should show live listings for signed-in users.";
  }

  return NextResponse.json({
    ok: !head.error && !sample.error,
    supabaseHost: host,
    jobsTableCount: head.count,
    headError: head.error?.message ?? null,
    headErrorCode: head.error?.code ?? null,
    sampleRowCount: sample.data?.length ?? 0,
    sampleError: sample.error?.message ?? null,
    samplePreview: sample.data ?? null,
    hint,
  });
}
