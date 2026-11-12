import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session-server";
import { clientIp, checkRateLimit } from "@/lib/hidden-opportunities/rate-limit";
import { composePrepPack, validateComposeInput, ROLE_TEMPLATES } from "@/lib/prep-pack";
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

export async function GET() {
  return NextResponse.json({
    ok: true,
    roles: ROLE_TEMPLATES.map((role) => ({
      id: role.id,
      title: role.title,
      seniority: role.seniority,
      summary: role.summary,
    })),
  });
}

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const rate = checkRateLimit(`prep-pack:${ip}`, { limit: 20, windowMs: 60_000 });
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many prep pack requests. Try again shortly." },
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

    let guides: VaultExperienceListItem[] = [];
    if (supabaseConfigured()) {
      try {
        guides = await listPublishedExperiences({});
      } catch (err) {
        logRouteError("prep-pack/list-guides", err);
        guides = [];
      }
    }

    const pack = composePrepPack(parsed.data, guides);
    const user = await getSessionUser();
    void recordEvent("prep_pack_generated", user?.id ?? null, {
      mode: pack.input_mode === "job_description" ? "jd" : "role",
      guide_count: pack.guides.length,
      skill_count: pack.requirements.length,
    });

    return NextResponse.json({ ok: true, pack });
  } catch (err) {
    logRouteError("prep-pack", err);
    const message = err instanceof Error ? err.message : "Could not build a prep pack.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
