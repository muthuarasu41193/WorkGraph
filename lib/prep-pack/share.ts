import { randomBytes } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { logRouteError } from "@/lib/security/log";
import type { PrepPackResult, PrepPackSharePayload } from "./types";
import { toShareablePack } from "./compose";

const SHARE_ID_BYTES = 12;
const SHARE_TTL_DAYS = 30;

export function newPrepPackShareId(): string {
  return randomBytes(SHARE_ID_BYTES).toString("base64url");
}

export function shareExpiresAt(now = new Date()): string {
  const expires = new Date(now.getTime() + SHARE_TTL_DAYS * 86_400_000);
  return expires.toISOString();
}

export type SavePrepPackShareResult =
  | { ok: true; shareId: string; expiresAt: string }
  | { ok: false; reason: "unconfigured" | "insert_failed" };

/**
 * Persist a shareable prep pack. Never stores pasted job description text,
 * resumes, or profile details — only the sanitized pack projection.
 */
export async function savePrepPackShare(
  pack: PrepPackResult,
  options?: { userId?: string | null },
): Promise<SavePrepPackShareResult> {
  const admin = createSupabaseAdminClient();
  if (!admin) return { ok: false, reason: "unconfigured" };

  const shareId = newPrepPackShareId();
  const expiresAt = shareExpiresAt();
  const payload: PrepPackSharePayload = {
    ...toShareablePack(pack),
    created_at: new Date().toISOString(),
  };

  const { error } = await admin.from("prep_packs").insert({
    share_id: shareId,
    user_id: options?.userId ?? null,
    payload,
    expires_at: expiresAt,
  });

  if (error) {
    logRouteError("prep-pack/share", error);
    return { ok: false, reason: "insert_failed" };
  }

  return { ok: true, shareId, expiresAt };
}

export async function getPrepPackShare(
  shareId: string,
): Promise<PrepPackSharePayload | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("prep_packs")
    .select("payload, expires_at")
    .eq("share_id", shareId)
    .maybeSingle();

  if (error) {
    logRouteError("prep-pack/get-share", error);
    return null;
  }
  if (!data) return null;

  const expiresAt = data.expires_at ? new Date(String(data.expires_at)).getTime() : null;
  if (expiresAt != null && expiresAt < Date.now()) return null;

  return data.payload as PrepPackSharePayload;
}
