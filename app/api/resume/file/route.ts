import { NextResponse } from "next/server";

import { getSupabaseSessionUser } from "../../../../lib/route-auth";
import { isOwnedResumeStoragePath } from "../../../../lib/security/resume-access";
import { logRouteError } from "../../../../lib/security/log";
import { createSupabaseAdminClient } from "../../../../lib/supabase-admin";
import { uuidSchema } from "../../../../lib/validation/primitives";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC_MISSING = "No resume on file.";

/**
 * Authenticated download via a short-lived signed URL.
 * Never returns a durable public URL.
 *
 * - Owner: GET /api/resume/file
 * - Employer who received the application: GET /api/resume/file?connectionId=
 */
export async function GET(request: Request) {
  const {
    data: { user },
    error,
  } = await getSupabaseSessionUser(request);
  if (error || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Could not open your resume." }, { status: 500 });
  }

  try {
    const connectionIdRaw = new URL(request.url).searchParams.get("connectionId");
    let storagePath = "";
    let ownerUserId = user.id;

    if (connectionIdRaw) {
      const parsed = uuidSchema.safeParse(connectionIdRaw);
      if (!parsed.success) {
        return NextResponse.json({ error: GENERIC_MISSING }, { status: 404 });
      }

      const { data: connection } = await supabase
        .from("signal_connections")
        .select("id, seeker_id, hiring_signals!inner(employer_id)")
        .eq("id", parsed.data)
        .maybeSingle();

      const row = connection as
        | { seeker_id?: string; hiring_signals?: { employer_id?: string } | { employer_id?: string }[] }
        | null;
      const signal = Array.isArray(row?.hiring_signals) ? row.hiring_signals[0] : row?.hiring_signals;
      const employerId = signal?.employer_id ? String(signal.employer_id) : "";
      const seekerId = row?.seeker_id ? String(row.seeker_id) : "";

      if (!employerId || employerId !== user.id || !seekerId) {
        return NextResponse.json({ error: GENERIC_MISSING }, { status: 404 });
      }

      ownerUserId = seekerId;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("resume_storage_path")
      .eq("id", ownerUserId)
      .maybeSingle();

    storagePath =
      typeof profile?.resume_storage_path === "string" ? profile.resume_storage_path : "";

    if (!storagePath) {
      const { data: version } = await supabase
        .from("resume_versions")
        .select("storage_path")
        .eq("user_id", ownerUserId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      storagePath = typeof version?.storage_path === "string" ? version.storage_path : "";
    }

    if (!isOwnedResumeStoragePath(storagePath, ownerUserId)) {
      return NextResponse.json({ error: GENERIC_MISSING }, { status: 404 });
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from("resumes")
      .createSignedUrl(storagePath, 60);

    if (signedError || !signed?.signedUrl) {
      return NextResponse.json({ error: "Could not open your resume." }, { status: 404 });
    }

    return NextResponse.redirect(signed.signedUrl, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    logRouteError("resume/file", err);
    return NextResponse.json({ error: "Could not open your resume." }, { status: 500 });
  }
}
