import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { EmployerProfile, HiringSignal } from "./types";
import { isHiringIntent, isWorkMode, type FitSignal } from "./types";

export type PublicCompanyPage = {
  profile: EmployerProfile;
  signals: HiringSignal[];
};

function parseFitSignals(raw: unknown): FitSignal[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const label = String(o.label ?? "").trim();
      if (!label) return null;
      const kind = o.kind === "trait" || o.kind === "context" ? o.kind : "skill";
      return { label, kind, weight: Number(o.weight) || 1 };
    })
    .filter((x): x is FitSignal => x !== null);
}

function mapEmployer(row: Record<string, unknown>): EmployerProfile {
  return {
    id: String(row.id),
    company_name: String(row.company_name ?? ""),
    company_slug: String(row.company_slug ?? ""),
    tagline: row.tagline != null ? String(row.tagline) : null,
    website_url: row.website_url != null ? String(row.website_url) : null,
    logo_url: row.logo_url != null ? String(row.logo_url) : null,
    hiring_philosophy: row.hiring_philosophy != null ? String(row.hiring_philosophy) : null,
    team_size: row.team_size != null ? String(row.team_size) : null,
    verification_status: String(row.verification_status ?? "unverified") as EmployerProfile["verification_status"],
    verified_at: row.verified_at != null ? String(row.verified_at) : null,
    verified_domain: row.verified_domain != null ? String(row.verified_domain) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapSignal(row: Record<string, unknown>, employer: EmployerProfile): HiringSignal {
  return {
    id: String(row.id),
    employer_id: String(row.employer_id),
    title: String(row.title ?? ""),
    location: String(row.location ?? ""),
    work_mode: isWorkMode(String(row.work_mode)) ? (String(row.work_mode) as HiringSignal["work_mode"]) : "flexible",
    hiring_intent: isHiringIntent(String(row.hiring_intent))
      ? (String(row.hiring_intent) as HiringSignal["hiring_intent"])
      : "actively_hiring",
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
      company_name: employer.company_name,
      company_slug: employer.company_slug,
      tagline: employer.tagline,
      logo_url: employer.logo_url,
      verification_status: employer.verification_status,
      verified_at: employer.verified_at,
    },
  };
}

/** Load verified company + live signals for public /company/[slug] page. */
export async function getPublicCompanyBySlug(slug: string): Promise<PublicCompanyPage | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const normalized = slug.toLowerCase().trim();
  const { data: profileRow, error: profileErr } = await admin
    .from("employer_profiles")
    .select("*")
    .eq("company_slug", normalized)
    .eq("verification_status", "verified")
    .maybeSingle();

  if (profileErr || !profileRow) return null;

  const profile = mapEmployer(profileRow as Record<string, unknown>);

  const { data: signals } = await admin
    .from("hiring_signals")
    .select("*")
    .eq("employer_id", profile.id)
    .eq("status", "live")
    .order("published_at", { ascending: false });

  return {
    profile,
    signals: (signals ?? []).map((row) =>
      mapSignal(row as Record<string, unknown>, profile),
    ),
  };
}
