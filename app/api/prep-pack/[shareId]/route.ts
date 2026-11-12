import { NextResponse } from "next/server";
import { getPrepPackShare } from "@/lib/prep-pack";
import { recordEvent } from "@/lib/metrics/record";
import { logRouteError } from "@/lib/security/log";
import { supabaseConfigured } from "@/lib/supabase-enabled";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ shareId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    if (!supabaseConfigured()) {
      return NextResponse.json({ ok: false, error: "Not available." }, { status: 503 });
    }

    const { shareId } = await params;
    if (!shareId || shareId.length < 16 || shareId.length > 64 || !/^[A-Za-z0-9_-]+$/.test(shareId)) {
      return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
    }

    const pack = await getPrepPackShare(shareId);
    if (!pack) {
      return NextResponse.json({ ok: false, error: "Not found or expired." }, { status: 404 });
    }

    void recordEvent("prep_pack_viewed", null, {
      mode: pack.input_mode === "job_description" ? "jd" : "role",
      guide_count: pack.guides.length,
    });

    return NextResponse.json({ ok: true, pack: { ...pack, share_id: shareId } });
  } catch (err) {
    logRouteError("prep-pack/get", err);
    return NextResponse.json({ ok: false, error: "Could not load pack." }, { status: 500 });
  }
}
