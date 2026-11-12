import { cookies } from "next/headers";

import { getSessionUser } from "@/lib/auth/session-server";
import { logRouteError } from "@/lib/security/log";
import { createServerSupabaseClient } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase-enabled";
import type { PrepPackSaveInput } from "@/lib/validation/prep-pack";

import { buildPrepPack } from "./build";
import type {
  PrepPackGuideCandidate,
  PrepPackResult,
  SavedPrepPack,
  SavedPrepPackSummary,
} from "./types";

export class PrepPackApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const GUIDE_SELECT =
  "id,company,role,level,difficulty,rounds,rounds_data,avg_rating,price_inr,status";

const SAVED_SELECT =
  "id,user_id,role_id,role_label,skills,guides,checklist,estimate_notice,created_at,updated_at";

/** Cap how many published guides we score in memory. */
export const PREP_PACK_GUIDE_FETCH_LIMIT = 120;

async function requireSupabase() {
  if (!supabaseConfigured()) {
    throw new PrepPackApiError("Supabase is not configured", 503);
  }
  return createServerSupabaseClient(await cookies());
}

function roundNamesFromRow(roundsData: unknown): string[] {
  if (!Array.isArray(roundsData)) return [];
  const names: string[] = [];
  for (const item of roundsData) {
    if (!item || typeof item !== "object") continue;
    const name = (item as { name?: unknown }).name;
    if (typeof name === "string" && name.trim()) names.push(name.trim().slice(0, 120));
    if (names.length >= 12) break;
  }
  return names;
}

function mapGuideCandidate(row: Record<string, unknown>): PrepPackGuideCandidate {
  return {
    id: String(row.id),
    company: String(row.company ?? ""),
    role: String(row.role ?? ""),
    level: row.level != null ? String(row.level) : null,
    difficulty: row.difficulty != null ? String(row.difficulty) : null,
    rounds: typeof row.rounds === "number" ? row.rounds : row.rounds != null ? Number(row.rounds) : null,
    avg_rating: row.avg_rating != null ? Number(row.avg_rating) : null,
    price_inr: Number(row.price_inr ?? 0),
    roundNames: roundNamesFromRow(row.rounds_data),
  };
}

export async function listPublishedGuidesForPrep(): Promise<PrepPackGuideCandidate[]> {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("vault_experiences")
    .select(GUIDE_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(PREP_PACK_GUIDE_FETCH_LIMIT);

  if (error) {
    logRouteError("prep-pack/guides", error);
    throw new PrepPackApiError("Could not load interview guides.", 500);
  }

  return (data ?? []).map((row) => mapGuideCandidate(row as Record<string, unknown>));
}

export async function buildPrepPackForRequest(input: {
  jobDescription?: string;
  roleId?: string;
}): Promise<PrepPackResult> {
  let guides: PrepPackGuideCandidate[] = [];
  if (supabaseConfigured()) {
    try {
      guides = await listPublishedGuidesForPrep();
    } catch (err) {
      if (err instanceof PrepPackApiError && err.status === 503) {
        guides = [];
      } else {
        throw err;
      }
    }
  }

  return buildPrepPack({
    jobDescription: input.jobDescription,
    roleId: input.roleId,
    guides,
  });
}

function mapSavedRow(row: Record<string, unknown>): SavedPrepPack {
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

function toSummary(pack: SavedPrepPack): SavedPrepPackSummary {
  return {
    id: pack.id,
    role_id: pack.role_id,
    role_label: pack.role_label,
    skill_count: pack.skill_count,
    guide_count: pack.guide_count,
    created_at: pack.created_at,
    updated_at: pack.updated_at,
  };
}

async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new PrepPackApiError("Unauthorized", 401);
  const supabase = await requireSupabase();
  return { user, supabase };
}

/** Max saved packs per user — enforced in app code. */
export const PREP_PACK_SAVE_MAX_PER_USER = 25;

export async function savePrepPackForUser(input: PrepPackSaveInput): Promise<SavedPrepPack> {
  const { user, supabase } = await requireUser();

  const { count, error: countError } = await supabase
    .from("prep_packs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) {
    logRouteError("prep-pack/save-count", countError);
    throw new PrepPackApiError("Could not save prep pack.", 500);
  }
  if ((count ?? 0) >= PREP_PACK_SAVE_MAX_PER_USER) {
    throw new PrepPackApiError("You already have the maximum number of saved prep packs.", 400);
  }

  const { data, error } = await supabase
    .from("prep_packs")
    .insert({
      user_id: user.id,
      role_id: input.roleId,
      role_label: input.roleLabel,
      skills: input.skills,
      guides: input.guides,
      checklist: input.checklist,
      estimate_notice: input.estimateNotice,
    })
    .select(SAVED_SELECT)
    .single();

  if (error || !data) {
    logRouteError("prep-pack/save", error ?? new Error("missing row"));
    throw new PrepPackApiError("Could not save prep pack.", 500);
  }

  return mapSavedRow(data as Record<string, unknown>);
}

export async function listSavedPrepPacksForUser(): Promise<SavedPrepPackSummary[]> {
  const { user, supabase } = await requireUser();
  const { data, error } = await supabase
    .from("prep_packs")
    .select(SAVED_SELECT)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    logRouteError("prep-pack/list", error);
    throw new PrepPackApiError("Could not load saved prep packs.", 500);
  }

  return (data ?? []).map((row) => toSummary(mapSavedRow(row as Record<string, unknown>)));
}

export async function getSavedPrepPackForUser(id: string): Promise<SavedPrepPack | null> {
  const { user, supabase } = await requireUser();
  const { data, error } = await supabase
    .from("prep_packs")
    .select(SAVED_SELECT)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    logRouteError("prep-pack/get", error);
    throw new PrepPackApiError("Could not load that prep pack.", 500);
  }
  if (!data) return null;
  return mapSavedRow(data as Record<string, unknown>);
}

export async function deleteSavedPrepPackForUser(id: string): Promise<void> {
  const { user, supabase } = await requireUser();
  const { data, error } = await supabase
    .from("prep_packs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    logRouteError("prep-pack/delete", error);
    throw new PrepPackApiError("Could not delete that prep pack.", 500);
  }
  if (!data) {
    throw new PrepPackApiError("Prep pack not found.", 404);
  }
}
