import { NextResponse } from "next/server";
import { fetchAllHiddenOpportunities } from "@/lib/hidden-opportunities/aggregate";
import { checkRateLimit, clientIp } from "@/lib/hidden-opportunities/rate-limit";
import { parseHiddenJobsQuery } from "@/lib/hidden-opportunities/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const ip = clientIp(request);
  const rate = checkRateLimit(`hidden-jobs:get:${ip}`);
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSec) },
      },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = parseHiddenJobsQuery(searchParams);
    const payload = await fetchAllHiddenOpportunities(query);

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load hidden jobs";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
