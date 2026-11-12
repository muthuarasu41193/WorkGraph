import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session-server";
import { clientIp, checkRateLimit } from "@/lib/hidden-opportunities/rate-limit";
import { recordEvent } from "@/lib/metrics/record";
import { logRouteError } from "@/lib/security/log";
import { createServerSupabaseClient } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase-enabled";
import { isVaultReportReason, VAULT_REPORT_REASONS } from "@/lib/vault-trust";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z
  .object({
    reason: z.string(),
    details: z.string().max(2000).optional(),
  })
  .strict();

export async function POST(request: Request, { params }: Params) {
  try {
    if (!supabaseConfigured()) {
      return NextResponse.json({ ok: false, error: "Reporting is unavailable." }, { status: 503 });
    }

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Sign in to report a guide." }, { status: 401 });
    }

    const ip = clientIp(request);
    const rate = checkRateLimit(`vault-report:${user.id}:${ip}`, { limit: 8, windowMs: 60_000 });
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many reports. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
      );
    }

    const { id } = await params;
    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success || !isVaultReportReason(parsed.data.reason)) {
      return NextResponse.json(
        { ok: false, error: "Choose a valid report reason.", reasons: VAULT_REPORT_REASONS },
        { status: 400 },
      );
    }

    const details = parsed.data.details?.trim() || null;
    // Refuse obvious document dumps / emails in free text.
    if (details && (/@/.test(details) || details.length > 2000)) {
      return NextResponse.json(
        { ok: false, error: "Do not include email addresses or long document text in a report." },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient(await cookies());
    const { data: experience, error: lookupError } = await supabase
      .from("vault_experiences")
      .select("id,status")
      .eq("id", id)
      .maybeSingle();

    if (lookupError) {
      logRouteError("vault/report-lookup", lookupError);
      return NextResponse.json({ ok: false, error: "Could not submit report." }, { status: 500 });
    }
    if (!experience || experience.status !== "published") {
      return NextResponse.json({ ok: false, error: "Guide not found." }, { status: 404 });
    }

    const { error } = await supabase.from("vault_content_reports").insert({
      experience_id: id,
      reporter_id: user.id,
      reason: parsed.data.reason,
      details,
      status: "open",
    });

    if (error) {
      logRouteError("vault/report", error);
      return NextResponse.json({ ok: false, error: "Could not submit report." }, { status: 500 });
    }

    void recordEvent("vault_report_submitted", user.id, { reason: parsed.data.reason });

    return NextResponse.json({
      ok: true,
      message:
        "Report received. A person can review it. Do not upload verification documents or work emails here.",
    });
  } catch (err) {
    logRouteError("vault/report", err);
    return NextResponse.json({ ok: false, error: "Could not submit report." }, { status: 500 });
  }
}
