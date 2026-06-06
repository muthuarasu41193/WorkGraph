import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/session-server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase-enabled";
import {
  isConnectionStage,
  isHiringIntent,
  isHiringSignalStatus,
  isWorkMode,
  slugifyCompany,
  type ConnectionStage,
  type EmployerProfile,
  type EmployerVerificationStatus,
  type FitSignal,
  type HiringIntent,
  type HiringSignal,
  type HiringSignalStatus,
  type SignalConnection,
  type WorkMode,
} from "./types";
import { evaluateEmployerVerification } from "./verification";
import { notifySeekerOfStageUpdate } from "./notify";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export class EmployerApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function requireEmployerSession(request?: Request) {
  const user = await getSessionUser(request);
  if (!user) throw new EmployerApiError("Unauthorized", 401);
  if (!supabaseConfigured()) throw new EmployerApiError("Supabase is not configured", 503);
  const supabase = createServerSupabaseClient(await cookies());
  return { user, supabase };
}

function mapEmployerRow(row: Record<string, unknown>): EmployerProfile {
  return {
    id: String(row.id),
    company_name: String(row.company_name ?? ""),
    company_slug: String(row.company_slug ?? ""),
    tagline: row.tagline != null ? String(row.tagline) : null,
    website_url: row.website_url != null ? String(row.website_url) : null,
    logo_url: row.logo_url != null ? String(row.logo_url) : null,
    hiring_philosophy: row.hiring_philosophy != null ? String(row.hiring_philosophy) : null,
    team_size: row.team_size != null ? String(row.team_size) : null,
    verification_status: isEmployerVerificationStatus(String(row.verification_status))
      ? (String(row.verification_status) as EmployerVerificationStatus)
      : "unverified",
    verified_at: row.verified_at != null ? String(row.verified_at) : null,
    verified_domain: row.verified_domain != null ? String(row.verified_domain) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function isEmployerVerificationStatus(v: string): v is EmployerVerificationStatus {
  return v === "unverified" || v === "pending" || v === "verified" || v === "rejected";
}

function parseFitSignals(raw: unknown): FitSignal[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const label = String(o.label ?? "").trim();
      if (!label) return null;
      const kind = o.kind === "trait" || o.kind === "context" ? o.kind : "skill";
      const weight = Number(o.weight);
      return {
        label,
        kind,
        weight: Number.isFinite(weight) ? Math.min(3, Math.max(1, weight)) : 1,
      };
    })
    .filter((x): x is FitSignal => x !== null);
}

function mapSignalRow(row: Record<string, unknown>, employer?: EmployerProfile): HiringSignal {
  return {
    id: String(row.id),
    employer_id: String(row.employer_id),
    title: String(row.title ?? ""),
    location: String(row.location ?? ""),
    work_mode: isWorkMode(String(row.work_mode)) ? (String(row.work_mode) as WorkMode) : "flexible",
    hiring_intent: isHiringIntent(String(row.hiring_intent))
      ? (String(row.hiring_intent) as HiringIntent)
      : "actively_hiring",
    why_now: String(row.why_now ?? ""),
    description: String(row.description ?? ""),
    fit_signals: parseFitSignals(row.fit_signals),
    comp_hint: row.comp_hint != null ? String(row.comp_hint) : null,
    status: isHiringSignalStatus(String(row.status))
      ? (String(row.status) as HiringSignalStatus)
      : "draft",
    applies_count: Number(row.applies_count ?? 0),
    published_at: row.published_at != null ? String(row.published_at) : null,
    closes_at: row.closes_at != null ? String(row.closes_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    employer: employer
      ? {
          company_name: employer.company_name,
          company_slug: employer.company_slug,
          tagline: employer.tagline,
          logo_url: employer.logo_url,
          verification_status: employer.verification_status,
          verified_at: employer.verified_at,
        }
      : undefined,
  };
}

function mapConnectionRow(row: Record<string, unknown>): SignalConnection {
  return {
    id: String(row.id),
    signal_id: String(row.signal_id),
    seeker_id: String(row.seeker_id),
    connection_note: String(row.connection_note ?? ""),
    fit_snapshot: (row.fit_snapshot as SignalConnection["fit_snapshot"]) ?? {
      matchPercent: 0,
      matchedSignals: [],
      profileCompleteness: 0,
    },
    stage: isConnectionStage(String(row.stage))
      ? (String(row.stage) as ConnectionStage)
      : "incoming",
    employer_reply: row.employer_reply != null ? String(row.employer_reply) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getEmployerProfileForUser(request?: Request): Promise<EmployerProfile | null> {
  const { user, supabase } = await requireEmployerSession(request);
  const { data, error } = await supabase
    .from("employer_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new EmployerApiError(error.message, 500);
  if (!data) return null;
  return mapEmployerRow(data as Record<string, unknown>);
}

export async function upsertEmployerProfile(
  input: {
    company_name: string;
    company_slug?: string;
    tagline?: string;
    website_url?: string;
    hiring_philosophy?: string;
    team_size?: string;
  },
  request?: Request,
): Promise<EmployerProfile> {
  const { user, supabase } = await requireEmployerSession(request);
  const company_name = input.company_name?.trim();
  if (!company_name) throw new EmployerApiError("Company name is required", 400);

  let slug = (input.company_slug?.trim() || slugifyCompany(company_name)).toLowerCase();
  slug = slug.replace(/[^a-z0-9-]/g, "").slice(0, 48) || slugifyCompany(company_name);

  const { data, error } = await supabase
    .from("employer_profiles")
    .upsert({
      id: user.id,
      company_name,
      company_slug: slug,
      tagline: input.tagline?.trim() || null,
      website_url: input.website_url?.trim() || null,
      hiring_philosophy: input.hiring_philosophy?.trim() || null,
      team_size: input.team_size?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new EmployerApiError("That company URL slug is taken — try another.", 409);
    }
    throw new EmployerApiError(error.message, 500);
  }
  return mapEmployerRow(data as Record<string, unknown>);
}

export async function listEmployerSignals(request?: Request): Promise<HiringSignal[]> {
  const { user, supabase } = await requireEmployerSession(request);
  const { data, error } = await supabase
    .from("hiring_signals")
    .select("*")
    .eq("employer_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) throw new EmployerApiError(error.message, 500);
  return (data ?? []).map((row) => mapSignalRow(row as Record<string, unknown>));
}

export async function getEmployerSignal(signalId: string, request?: Request): Promise<HiringSignal | null> {
  const { user, supabase } = await requireEmployerSession(request);
  const { data, error } = await supabase
    .from("hiring_signals")
    .select("*")
    .eq("id", signalId)
    .eq("employer_id", user.id)
    .maybeSingle();
  if (error) throw new EmployerApiError(error.message, 500);
  if (!data) return null;
  return mapSignalRow(data as Record<string, unknown>);
}

export type HiringSignalInput = {
  title: string;
  location?: string;
  work_mode?: string;
  hiring_intent?: string;
  why_now?: string;
  description?: string;
  fit_signals?: FitSignal[];
  comp_hint?: string;
  status?: HiringSignalStatus;
};

export async function createEmployerSignal(input: HiringSignalInput, request?: Request): Promise<HiringSignal> {
  const { user, supabase } = await requireEmployerSession(request);
  const profile = await getEmployerProfileForUser(request);
  if (!profile) throw new EmployerApiError("Complete employer onboarding first", 400);

  const title = input.title?.trim();
  if (!title) throw new EmployerApiError("Signal title is required", 400);

  const status = input.status && isHiringSignalStatus(input.status) ? input.status : "draft";
  const published_at = status === "live" ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from("hiring_signals")
    .insert({
      employer_id: user.id,
      title,
      location: input.location?.trim() ?? "",
      work_mode: input.work_mode && isWorkMode(input.work_mode) ? input.work_mode : "flexible",
      hiring_intent:
        input.hiring_intent && isHiringIntent(input.hiring_intent)
          ? input.hiring_intent
          : "actively_hiring",
      why_now: input.why_now?.trim() ?? "",
      description: input.description?.trim() ?? "",
      fit_signals: input.fit_signals ?? [],
      comp_hint: input.comp_hint?.trim() || null,
      status,
      published_at,
    })
    .select("*")
    .single();

  if (error) throw new EmployerApiError(error.message, 500);
  return mapSignalRow(data as Record<string, unknown>);
}

export async function updateEmployerSignal(
  signalId: string,
  input: HiringSignalInput,
  request?: Request,
): Promise<HiringSignal> {
  const { user, supabase } = await requireEmployerSession(request);
  const existing = await getEmployerSignal(signalId, request);
  if (!existing) throw new EmployerApiError("Signal not found", 404);

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.location !== undefined) patch.location = input.location.trim();
  if (input.work_mode !== undefined && isWorkMode(input.work_mode)) patch.work_mode = input.work_mode;
  if (input.hiring_intent !== undefined && isHiringIntent(input.hiring_intent)) {
    patch.hiring_intent = input.hiring_intent;
  }
  if (input.why_now !== undefined) patch.why_now = input.why_now.trim();
  if (input.description !== undefined) patch.description = input.description.trim();
  if (input.fit_signals !== undefined) patch.fit_signals = input.fit_signals;
  if (input.comp_hint !== undefined) patch.comp_hint = input.comp_hint.trim() || null;
  if (input.status !== undefined && isHiringSignalStatus(input.status)) {
    patch.status = input.status;
    if (input.status === "live" && !existing.published_at) {
      patch.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from("hiring_signals")
    .update(patch)
    .eq("id", signalId)
    .eq("employer_id", user.id)
    .select("*")
    .single();

  if (error) throw new EmployerApiError(error.message, 500);
  return mapSignalRow(data as Record<string, unknown>);
}

export async function listConnectionsForEmployer(signalId?: string): Promise<SignalConnection[]> {
  const { user, supabase } = await requireEmployerSession();

  let query = supabase
    .from("signal_connections")
    .select("*, hiring_signals!inner(id, title, employer_id)")
    .eq("hiring_signals.employer_id", user.id)
    .order("created_at", { ascending: false });

  if (signalId) query = query.eq("signal_id", signalId);

  const { data, error } = await query;
  if (error) throw new EmployerApiError(error.message, 500);

  const seekerIds = [...new Set((data ?? []).map((r) => String((r as Record<string, unknown>).seeker_id)))];
  const profilesById = new Map<string, SignalConnection["seeker"]>();

  if (seekerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, headline, email, skills, profile_completeness")
      .in("id", seekerIds);

    for (const p of profiles ?? []) {
      const row = p as Record<string, unknown>;
      profilesById.set(String(row.id), {
        full_name: row.full_name != null ? String(row.full_name) : null,
        headline: row.headline != null ? String(row.headline) : null,
        email: row.email != null ? String(row.email) : null,
        skills: Array.isArray(row.skills)
          ? (row.skills as unknown[]).map((s) => String(s)).filter(Boolean)
          : [],
        profile_completeness: Number(row.profile_completeness ?? 0),
      });
    }
  }

  return (data ?? []).map((raw) => {
    const row = raw as Record<string, unknown>;
    const hs = row.hiring_signals as Record<string, unknown> | undefined;
    const conn = mapConnectionRow(row);
    conn.signal = hs
      ? { id: String(hs.id), title: String(hs.title), employer_id: String(hs.employer_id) }
      : undefined;
    conn.seeker = profilesById.get(conn.seeker_id);
    return conn;
  });
}

export async function updateConnectionStage(
  connectionId: string,
  stage: ConnectionStage,
  employer_reply?: string,
): Promise<SignalConnection> {
  const { user, supabase } = await requireEmployerSession();
  if (!isConnectionStage(stage)) throw new EmployerApiError("Invalid stage", 400);

  const { data: owned } = await supabase
    .from("signal_connections")
    .select(
      "id, seeker_id, stage, hiring_signals!inner(id, title, employer_id, employer_profiles(company_name))",
    )
    .eq("id", connectionId)
    .maybeSingle();

  if (!owned) throw new EmployerApiError("Connection not found", 404);
  const ownedRow = owned as Record<string, unknown>;
  const hs = ownedRow.hiring_signals as Record<string, unknown>;
  if (String(hs.employer_id) !== user.id) throw new EmployerApiError("Forbidden", 403);

  const previousStage = String(ownedRow.stage);
  const patch: Record<string, unknown> = { stage };
  if (employer_reply !== undefined) patch.employer_reply = employer_reply.trim() || null;

  const { data, error } = await supabase
    .from("signal_connections")
    .update(patch)
    .eq("id", connectionId)
    .select("*")
    .single();

  if (error) throw new EmployerApiError(error.message, 500);

  const conn = mapConnectionRow(data as Record<string, unknown>);
  const emp = hs.employer_profiles as Record<string, unknown> | undefined;
  const companyName = emp ? String(emp.company_name) : "Employer";

  if (previousStage !== stage) {
    void notifySeekerOfStageUpdate({
      seekerId: String(ownedRow.seeker_id),
      companyName,
      signalTitle: String(hs.title),
      stage,
      employerReply: employer_reply,
    });
  }

  return conn;
}

/** Request or refresh domain verification for the signed-in employer. */
export async function requestEmployerVerification(): Promise<EmployerProfile> {
  const { user, supabase } = await requireEmployerSession();
  const profile = await getEmployerProfileForUser();
  if (!profile) throw new EmployerApiError("Complete employer onboarding first", 400);

  const outcome = evaluateEmployerVerification({
    email: user.email,
    websiteUrl: profile.website_url,
  });

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    verification_requested_at: now,
    verification_note: outcome.reason,
  };

  if (outcome.status === "verified") {
    patch.verification_status = "verified";
    patch.verified_at = now;
    patch.verified_domain = outcome.domain;
  } else if (outcome.status === "rejected") {
    patch.verification_status = "rejected";
    patch.verified_at = null;
  } else {
    patch.verification_status = "pending";
    patch.verified_domain = outcome.domain;
  }

  const { data, error } = await supabase
    .from("employer_profiles")
    .update(patch)
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) throw new EmployerApiError(error.message, 500);
  return mapEmployerRow(data as Record<string, unknown>);
}

/** Manual approval (CRON_SECRET / EMPLOYER_ADMIN_SECRET header). */
export async function adminSetEmployerVerification(
  employerId: string,
  action: "approve" | "reject",
): Promise<EmployerProfile> {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new EmployerApiError("Admin client not configured", 503);

  const now = new Date().toISOString();
  const patch =
    action === "approve"
      ? { verification_status: "verified", verified_at: now }
      : { verification_status: "rejected", verified_at: null };

  const { data, error } = await admin
    .from("employer_profiles")
    .update(patch)
    .eq("id", employerId)
    .select("*")
    .single();

  if (error) throw new EmployerApiError(error.message, 500);
  return mapEmployerRow(data as Record<string, unknown>);
}
