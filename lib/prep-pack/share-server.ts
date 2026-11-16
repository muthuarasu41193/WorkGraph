import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { getSessionUser } from "@/lib/auth/session-server";
import { logRouteError } from "@/lib/security/log";
import { createServerSupabaseClient } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase-enabled";

import { PrepPackApiError } from "./server";
import { toPublicSharedPrepPack, type PublicSharedPrepPack } from "./share-public";
import {
  defaultShareExpiresAt,
  generatePrepPackShareToken,
  hashPrepPackShareToken,
  isPlausibleShareToken,
  PREP_PACK_SHARE_MAX_PER_PACK,
} from "./share-token";
import type { SavedPrepPack } from "./types";

const PACK_SELECT =
  "id,user_id,role_id,role_label,skills,guides,checklist,estimate_notice,created_at,updated_at";

const SHARE_SELECT = "id,pack_id,owner_id,token_hash,created_at,expires_at,revoked_at";

export type PrepPackShareRecord = {
  id: string;
  pack_id: string;
  owner_id: string;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
};

export type CreatedPrepPackShare = PrepPackShareRecord & {
  /** Raw token — returned once for the share URL. Never logged. */
  token: string;
  urlPath: string;
};

function mapPackRow(row: Record<string, unknown>): SavedPrepPack {
  return {
    id: String(row.id),
    role_id: row.role_id != null ? String(row.role_id) : null,
    role_label: row.role_label != null ? String(row.role_label) : null,
    skill_count: Array.isArray(row.skills) ? row.skills.length : 0,
    guide_count: Array.isArray(row.guides) ? row.guides.length : 0,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    skills: Array.isArray(row.skills) ? (row.skills as SavedPrepPack["skills"]) : [],
    guides: Array.isArray(row.guides) ? (row.guides as SavedPrepPack["guides"]) : [],
    checklist: Array.isArray(row.checklist) ? (row.checklist as SavedPrepPack["checklist"]) : [],
    estimate_notice: typeof row.estimate_notice === "string" ? row.estimate_notice : "",
  };
}

function mapShareRow(row: Record<string, unknown>): PrepPackShareRecord {
  return {
    id: String(row.id),
    pack_id: String(row.pack_id),
    owner_id: String(row.owner_id),
    created_at: String(row.created_at),
    expires_at: row.expires_at != null ? String(row.expires_at) : null,
    revoked_at: row.revoked_at != null ? String(row.revoked_at) : null,
  };
}

async function requireUserClient() {
  if (!supabaseConfigured()) {
    throw new PrepPackApiError("Supabase is not configured", 503);
  }
  const user = await getSessionUser();
  if (!user) {
    throw new PrepPackApiError("Sign in to share a prep pack.", 401);
  }
  const supabase = createServerSupabaseClient(await cookies());
  return { user, supabase };
}

function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isShareActive(share: PrepPackShareRecord, now = Date.now()): boolean {
  if (share.revoked_at) return false;
  if (share.expires_at && Date.parse(share.expires_at) <= now) return false;
  return true;
}

export async function createPrepPackShareForUser(packId: string): Promise<CreatedPrepPackShare> {
  const { user, supabase } = await requireUserClient();

  const { data: pack, error: packError } = await supabase
    .from("prep_packs")
    .select("id")
    .eq("id", packId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (packError) {
    logRouteError("prep-pack/share-create-pack", packError);
    throw new PrepPackApiError("Could not create a share link.", 500);
  }
  if (!pack) {
    throw new PrepPackApiError("Prep pack not found.", 404);
  }

  const { data: existing, error: existingError } = await supabase
    .from("prep_pack_shares")
    .select(SHARE_SELECT)
    .eq("pack_id", packId)
    .eq("owner_id", user.id)
    .is("revoked_at", null);

  if (existingError) {
    logRouteError("prep-pack/share-list", existingError);
    throw new PrepPackApiError("Could not create a share link.", 500);
  }

  const active = (existing ?? [])
    .map((row) => mapShareRow(row as Record<string, unknown>))
    .filter((share) => isShareActive(share));

  if (active.length >= PREP_PACK_SHARE_MAX_PER_PACK) {
    throw new PrepPackApiError("This pack already has the maximum number of active share links.", 400);
  }

  const { token, tokenHash } = generatePrepPackShareToken();
  const expiresAt = defaultShareExpiresAt();

  const { data, error } = await supabase
    .from("prep_pack_shares")
    .insert({
      pack_id: packId,
      owner_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    })
    .select(SHARE_SELECT)
    .single();

  if (error || !data) {
    logRouteError("prep-pack/share-insert", error ?? new Error("missing row"));
    throw new PrepPackApiError("Could not create a share link.", 500);
  }

  const record = mapShareRow(data as Record<string, unknown>);
  return {
    ...record,
    token,
    urlPath: `/s/prep/${token}`,
  };
}

export async function revokePrepPackShareForUser(shareId: string): Promise<PrepPackShareRecord> {
  const { user, supabase } = await requireUserClient();

  const { data, error } = await supabase
    .from("prep_pack_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", shareId)
    .eq("owner_id", user.id)
    .is("revoked_at", null)
    .select(SHARE_SELECT)
    .maybeSingle();

  if (error) {
    logRouteError("prep-pack/share-revoke", error);
    throw new PrepPackApiError("Could not revoke that share link.", 500);
  }
  if (!data) {
    throw new PrepPackApiError("Share link not found.", 404);
  }
  return mapShareRow(data as Record<string, unknown>);
}

export async function listPrepPackSharesForPack(packId: string): Promise<PrepPackShareRecord[]> {
  const { user, supabase } = await requireUserClient();

  const { data, error } = await supabase
    .from("prep_pack_shares")
    .select(SHARE_SELECT)
    .eq("pack_id", packId)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    logRouteError("prep-pack/share-list-pack", error);
    throw new PrepPackApiError("Could not load share links.", 500);
  }

  return (data ?? []).map((row) => mapShareRow(row as Record<string, unknown>));
}

/**
 * Resolve a public share by raw token.
 * Uses the service role so owner-only RLS on prep_packs does not leak via anon.
 * Returns null for missing, revoked, or expired links (caller shows not-found).
 */
export async function resolvePublicPrepPackShare(
  rawToken: string,
): Promise<PublicSharedPrepPack | null> {
  if (!isPlausibleShareToken(rawToken)) return null;
  if (!supabaseConfigured()) return null;

  const admin = serviceClient();
  if (!admin) {
    // Without service role, public share resolution cannot safely join owner packs.
    return null;
  }

  const tokenHash = hashPrepPackShareToken(rawToken.trim());
  const { data: shareRow, error: shareError } = await admin
    .from("prep_pack_shares")
    .select(SHARE_SELECT)
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (shareError) {
    logRouteError("prep-pack/share-resolve", shareError);
    return null;
  }
  if (!shareRow) return null;

  const share = mapShareRow(shareRow as Record<string, unknown>);
  if (!isShareActive(share)) return null;

  const { data: packRow, error: packError } = await admin
    .from("prep_packs")
    .select(PACK_SELECT)
    .eq("id", share.pack_id)
    .eq("user_id", share.owner_id)
    .maybeSingle();

  if (packError) {
    logRouteError("prep-pack/share-resolve-pack", packError);
    return null;
  }
  if (!packRow) return null;

  return toPublicSharedPrepPack(mapPackRow(packRow as Record<string, unknown>));
}
