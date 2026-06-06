import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/session-server";
import { createApplicationForUser } from "@/lib/applications-server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase-enabled";
import { loadUserProfile } from "@/lib/load-profile";
import { EmployerApiError } from "./employer-server";
import { scoreFitSignals } from "./fit-signals";
import { notifyEmployerOfConnection } from "./notify";
import type { EmployerVerificationStatus } from "./types";
import type { HiringSignal, SignalConnection } from "./types";
import { isConnectionStage, type FitSignal } from "./types";
import {
  buildApplicationSnapshot,
  parseApplicationSnapshot,
  type ApplicationInput,
} from "./application-snapshot";

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

function mapLiveSignal(row: Record<string, unknown>, employer: Record<string, unknown>): HiringSignal {
  return {
    id: String(row.id),
    employer_id: String(row.employer_id),
    title: String(row.title ?? ""),
    location: String(row.location ?? ""),
    work_mode: String(row.work_mode) as HiringSignal["work_mode"],
    hiring_intent: String(row.hiring_intent) as HiringSignal["hiring_intent"],
    why_now: String(row.why_now ?? ""),
    description: String(row.description ?? ""),
    fit_signals: parseFitSignals(row.fit_signals),
    comp_hint: row.comp_hint != null ? String(row.comp_hint) : null,
    status: "live",
    applies_count: Number(row.applies_count ?? 0),
    published_at: row.published_at != null ? String(row.published_at) : null,
    closes_at: row.closes_at != null ? String(row.closes_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    employer: {
      company_name: String(employer.company_name ?? ""),
      company_slug: String(employer.company_slug ?? ""),
      tagline: employer.tagline != null ? String(employer.tagline) : null,
      logo_url: employer.logo_url != null ? String(employer.logo_url) : null,
      verification_status: String(employer.verification_status ?? "unverified") as EmployerVerificationStatus,
      verified_at: employer.verified_at != null ? String(employer.verified_at) : null,
    },
  };
}

export async function listLiveHiringSignals(limit = 50): Promise<HiringSignal[]> {
  if (!supabaseConfigured()) return [];
  const supabase = createServerSupabaseClient(await cookies());

  const { data, error } = await supabase
    .from("hiring_signals")
    .select(
      "*, employer_profiles!inner(company_name, company_slug, tagline, logo_url, verification_status, verified_at)",
    )
    .eq("status", "live")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw new EmployerApiError(error.message, 500);

  return (data ?? []).map((raw) => {
    const row = raw as Record<string, unknown>;
    const emp = row.employer_profiles as Record<string, unknown>;
    return mapLiveSignal(row, emp);
  });
}

export async function connectToHiringSignal(
  signalId: string,
  input: ApplicationInput = {},
): Promise<SignalConnection> {
  const connectionNote = input.connectionNote ?? "";
  const user = await getSessionUser();
  if (!user) throw new EmployerApiError("Sign in to connect", 401);
  if (!supabaseConfigured()) throw new EmployerApiError("Supabase is not configured", 503);

  const profile = await loadUserProfile(user.id);
  if (!profile) throw new EmployerApiError("Complete your WorkGraph profile first", 400);

  const supabase = createServerSupabaseClient(await cookies());

  const { data: signal, error: sigErr } = await supabase
    .from("hiring_signals")
    .select("*, employer_profiles(company_name, id)")
    .eq("id", signalId)
    .eq("status", "live")
    .maybeSingle();

  if (sigErr) throw new EmployerApiError(sigErr.message, 500);
  if (!signal) throw new EmployerApiError("This hiring signal is not available", 404);

  const sigRow = signal as Record<string, unknown>;
  const fitSignals = parseFitSignals(sigRow.fit_signals);
  const fit_snapshot = scoreFitSignals(fitSignals, {
    skills: profile.skills,
    headline: profile.headline,
    summary: profile.summary,
    profileCompleteness: profile.profile_completeness,
  });

  const application_snapshot = buildApplicationSnapshot(profile, {
    ...input,
    connectionNote,
  });

  if (!application_snapshot.resume_url) {
    throw new EmployerApiError("Upload a resume on your profile or attach one to apply", 400);
  }

  const { data: conn, error: connErr } = await supabase
    .from("signal_connections")
    .insert({
      signal_id: signalId,
      seeker_id: user.id,
      connection_note: connectionNote.trim().slice(0, 2000),
      fit_snapshot,
      application_snapshot,
    })
    .select("*")
    .single();

  if (connErr) {
    if (connErr.code === "23505") {
      throw new EmployerApiError("You already connected to this signal", 409);
    }
    throw new EmployerApiError(connErr.message, 500);
  }

  const employer = sigRow.employer_profiles as Record<string, unknown> | null;
  const company = employer ? String(employer.company_name) : "Employer";

  try {
    await createApplicationForUser({
      company,
      role: String(sigRow.title),
      status: "applied",
      notes: `WorkGraph Direct connection · ${fit_snapshot.matchPercent}% fit`,
      job_url: `/profile?view=workgraph-direct`,
    });
  } catch {
    /* Kanban sync is best-effort */
  }

  const employerId = employer ? String(employer.id ?? sigRow.employer_id) : String(sigRow.employer_id);
  void notifyEmployerOfConnection({
    employerId,
    companyName: company,
    signalTitle: String(sigRow.title),
    seekerId: user.id,
    seekerName: profile.full_name?.trim() || profile.headline?.trim() || "A jobseeker",
    matchPercent: fit_snapshot.matchPercent,
    connectionNote: connectionNote.trim(),
    signalId,
  });

  return {
    id: String((conn as Record<string, unknown>).id),
    signal_id: signalId,
    seeker_id: user.id,
    connection_note: connectionNote.trim(),
    fit_snapshot,
    application_snapshot,
    stage: "incoming",
    employer_reply: null,
    created_at: String((conn as Record<string, unknown>).created_at),
    updated_at: String((conn as Record<string, unknown>).updated_at),
  };
}

export async function listSeekerConnections(): Promise<SignalConnection[]> {
  const user = await getSessionUser();
  if (!user) throw new EmployerApiError("Unauthorized", 401);
  if (!supabaseConfigured()) throw new EmployerApiError("Supabase is not configured", 503);

  const supabase = createServerSupabaseClient(await cookies());
  const { data, error } = await supabase
    .from("signal_connections")
    .select("*, hiring_signals(id, title, employer_id, employer_profiles(company_name, company_slug))")
    .eq("seeker_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new EmployerApiError(error.message, 500);

  return (data ?? []).map((raw) => {
    const row = raw as Record<string, unknown>;
    const hs = row.hiring_signals as Record<string, unknown> | undefined;
    const emp = hs?.employer_profiles as Record<string, unknown> | undefined;
    return {
      id: String(row.id),
      signal_id: String(row.signal_id),
      seeker_id: String(row.seeker_id),
      connection_note: String(row.connection_note ?? ""),
      fit_snapshot: row.fit_snapshot as SignalConnection["fit_snapshot"],
      application_snapshot: parseApplicationSnapshot(row.application_snapshot),
      stage: isConnectionStage(String(row.stage))
        ? (String(row.stage) as import("./types").ConnectionStage)
        : "incoming",
      employer_reply: row.employer_reply != null ? String(row.employer_reply) : null,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
      signal: hs
        ? {
            id: String(hs.id),
            title: String(hs.title),
            employer_id: String(hs.employer_id),
          }
        : undefined,
      seeker: emp
        ? undefined
        : undefined,
    };
  });
}
