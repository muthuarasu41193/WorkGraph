import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session-server";
import { clientIp, checkRateLimit } from "@/lib/hidden-opportunities/rate-limit";
import { composePrepPack, savePrepPackShare, validateComposeInput } from "@/lib/prep-pack";
import { recordEvent } from "@/lib/metrics/record";
import { logRouteError } from "@/lib/security/log";
import type { VaultExperienceListItem } from "@/lib/vault";
import { listPublishedExperiences } from "@/lib/vault-server";
import { supabaseConfigured } from "@/lib/supabase-enabled";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    jobDescription: z.string().max(20_000).optional(),
    roleTemplateId: z.string().max(64).optional(),
    companyHint: z.string().max(120).optional(),
    titleHint: z.string().max(160).optional(),
  })
  .strict();

/**
 * Creates a shareable prep pack. Recomputes from input so the stored payload
 * never accepts client-supplied free text beyond the validated compose inputs,
 * and never persists the job description itself.
 */
export async function POST(request: Request) {
  try {
    if (!supabaseConfigured()) {
      return NextResponse.json(
        { ok: false, error: "Sharing is unavailable until the database is configured." },
        { status: 503 },
      );
    }

    const ip = clientIp(request);
    const rate = checkRateLimit(`prep-pack-share:${ip}`, { limit: 10, windowMs: 60_000 });
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many share requests. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
      );
    }

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
    }

    const validationError = validateComposeInput(parsed.data);
    if (validationError) {
      return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
    }

    // Role-template shares are preferred: they never require storing JD text
    // even transiently in the request body beyond this handler.
    let guides: VaultExperienceListItem[] = [];
    try {
      guides = await listPublishedExperiences({});
    } catch (err) {
      logRouteError("prep-pack/share-list", err);
      guides = [];
    }

    const pack = composePrepPack(parsed.data, guides);
    // For JD-based packs, persist only the sanitized projection. The JD is
    // discarded after compose and is never written to prep_packs.payload.
    const user = await getSessionUser();
    const saved = await savePrepPackShare(pack, { userId: user?.id ?? null });
    if (!saved.ok) {
      return NextResponse.json(
        { ok: false, error: "Could not create a share link." },
        { status: saved.reason === "unconfigured" ? 503 : 500 },
      );
    }

    void recordEvent("prep_pack_shared", user?.id ?? null, {
      mode: pack.input_mode === "job_description" ? "jd" : "role",
      guide_count: pack.guides.length,
    });

    return NextResponse.json({
      ok: true,
      shareId: saved.shareId,
      expiresAt: saved.expiresAt,
      path: `/prepare/${saved.shareId}`,
    });
  } catch (err) {
    logRouteError("prep-pack/share", err);
    return NextResponse.json({ ok: false, error: "Could not create a share link." }, { status: 500 });
  }
}
