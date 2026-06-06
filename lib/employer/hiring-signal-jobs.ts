/**
 * Map live employer hiring signals into profile job cards for the Jobs tab.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecommendedJobCard } from "@/lib/job-dashboard";
import type { ProfileMatchInput } from "@/lib/job-match";
import { scoreFitSignals } from "./fit-signals";
import type { FitSignal, HiringSignal, WorkMode, EmployerVerificationStatus } from "./types";
import { WORK_MODE_LABELS } from "./types";

function formatPostedAgo(iso: string | null): string {
  if (!iso) return "Listed recently";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Listed recently";
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
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

function workModeLabel(mode: string): string {
  return mode in WORK_MODE_LABELS ? WORK_MODE_LABELS[mode as WorkMode] : "Flexible";
}

export function hiringSignalToJobCard(
  signal: HiringSignal,
  profile: ProfileMatchInput & { profileCompleteness?: number },
): RecommendedJobCard {
  const fit = scoreFitSignals(signal.fit_signals, profile);
  const description = [signal.why_now, signal.description, signal.comp_hint ? `Comp: ${signal.comp_hint}` : ""]
    .filter(Boolean)
    .join("\n\n");
  const location =
    signal.location.trim() ||
    workModeLabel(signal.work_mode);

  return {
    id: `wg-signal-${signal.id}`,
    title: signal.title,
    company: signal.employer?.company_name ?? "Employer",
    location,
    description,
    source: "workgraph",
    matchLabel:
      fit.matchedSignals.length > 0
        ? `${fit.matchPercent}% fit · ${fit.matchedSignals.slice(0, 3).join(", ")}`
        : `${fit.matchPercent}% fit · WorkGraph Direct`,
    postedAgo: formatPostedAgo(signal.published_at),
    postedAtIso: signal.published_at,
    kind: "listing",
    classification: "employer_hiring",
    isCommunity: false,
    matchedSkills: fit.matchedSignals.map((s) => s.toLowerCase()),
    applyUrl: `/profile?view=workgraph-direct&signal=${encodeURIComponent(signal.id)}`,
  };
}

export async function fetchLiveHiringSignalJobCards(
  supabase: SupabaseClient,
  profile: ProfileMatchInput & { profileCompleteness?: number },
  limit = 80,
): Promise<RecommendedJobCard[]> {
  const { data, error } = await supabase
    .from("hiring_signals")
    .select(
      "*, employer_profiles!inner(company_name, company_slug, tagline, logo_url, verification_status, verified_at)",
    )
    .eq("status", "live")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[hiring-signal-jobs] load error:", error.message);
    return [];
  }

  return (data ?? []).map((raw) => {
    const row = raw as Record<string, unknown>;
    const emp = row.employer_profiles as Record<string, unknown>;
    const signal: HiringSignal = {
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
        company_name: String(emp.company_name ?? ""),
        company_slug: String(emp.company_slug ?? ""),
        tagline: emp.tagline != null ? String(emp.tagline) : null,
        logo_url: emp.logo_url != null ? String(emp.logo_url) : null,
        verification_status: String(emp.verification_status ?? "unverified") as EmployerVerificationStatus,
        verified_at: emp.verified_at != null ? String(emp.verified_at) : null,
      },
    };
    return hiringSignalToJobCard(signal, profile);
  });
}

/** Prepend WorkGraph Direct signals and re-sort by match score when profile skills exist. */
export function mergeHiringSignalJobCards(
  jobs: RecommendedJobCard[],
  signals: RecommendedJobCard[],
  profile: ProfileMatchInput,
): RecommendedJobCard[] {
  if (signals.length === 0) return jobs;

  const seen = new Set(jobs.map((j) => j.id));
  const merged = [...signals.filter((s) => !seen.has(s.id)), ...jobs];
  const hasSkills = profile.skills.some((s) => s.trim().length > 0);
  if (!hasSkills) return merged;

  return [...merged].sort((a, b) => {
    const score = (card: RecommendedJobCard) => {
      const m = card.matchLabel.match(/^(\d+)%/);
      return m ? Number(m[1]) : 0;
    };
    return score(b) - score(a);
  });
}
