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

  return NextResponse.json({
    ok: !head.error,
    supabaseHost: host,
    jobsTableCount: head.count,
    headError: head.error?.message ?? null,
    headErrorCode: head.error?.code ?? null,
    sampleRowCount: sample.data?.length ?? 0,
    sampleError: sample.error?.message ?? null,
    samplePreview: sample.data ?? null,
    hint:
      head.count === 0 || sample.data?.length === 0
        ? "Count or rows are zero — run Python ingest against THIS project's Postgres, or fix Vercel env to match the project where you ran ingest."
        : head.error || sample.error
          ? "See headError / sampleError — often missing table, wrong key, or RLS blocking anon."
          : "Looks healthy — profile should show live feed after redeploy / hard refresh.",
  });
}
