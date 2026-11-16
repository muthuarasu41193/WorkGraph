import { cookies } from "next/headers";

import { createServerSupabaseClient } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase-enabled";
import { mapVaultExperienceRow, publicVaultListItem } from "@/lib/vault";

import { getPrepRoleById, PREP_ROLES, type PrepRoleDefinition } from "./roles";

export type RoleGuideCard = {
  id: string;
  company: string;
  role: string;
  level: string | null;
  difficulty: string | null;
  rounds: number | null;
  avg_rating: number | null;
  price_inr: number;
  href: string;
  /** Marketplace-style preview only (existing entitlement preview ratio). */
  preview: string;
};

function guideMatchesRole(guideRole: string, def: PrepRoleDefinition): boolean {
  const hay = guideRole.trim().toLowerCase();
  if (!hay) return false;
  if (hay.includes(def.label.toLowerCase())) return true;
  return def.aliases.some((alias) => hay.includes(alias.toLowerCase()));
}

/**
 * Roles that currently have at least one published Interview Vault guide.
 * Empty roles are omitted from sitemaps and acquisition pages.
 */
export async function listRolesWithPublishedGuides(): Promise<
  Array<{ role: PrepRoleDefinition; guideCount: number }>
> {
  if (!supabaseConfigured()) return [];

  try {
    const supabase = createServerSupabaseClient(await cookies());
    const { data, error } = await supabase
      .from("vault_experiences")
      .select("id,role,status")
      .eq("status", "published")
      .limit(500);

    if (error || !data) return [];

    const counts = new Map<string, number>();
    for (const row of data) {
      const guideRole = typeof row.role === "string" ? row.role : "";
      for (const def of PREP_ROLES) {
        if (guideMatchesRole(guideRole, def)) {
          counts.set(def.id, (counts.get(def.id) ?? 0) + 1);
        }
      }
    }

    return PREP_ROLES.filter((role) => (counts.get(role.id) ?? 0) > 0).map((role) => ({
      role,
      guideCount: counts.get(role.id) ?? 0,
    }));
  } catch {
    return [];
  }
}

export async function getPublishedGuidesForRole(roleId: string): Promise<{
  role: PrepRoleDefinition;
  guides: RoleGuideCard[];
} | null> {
  const role = getPrepRoleById(roleId);
  if (!role) return null;
  if (!supabaseConfigured()) {
    return { role, guides: [] };
  }

  try {
    const supabase = createServerSupabaseClient(await cookies());
    const { data, error } = await supabase
      .from("vault_experiences")
      .select(
        "id,seller_id,company,role,level,difficulty,rounds,rounds_data,avg_rating,price_inr,questions_html,tips_html,status,published_at,created_at,updated_at,view_count,sales_count,draft_step",
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(200);

    if (error || !data) {
      return { role, guides: [] };
    }

    const guides: RoleGuideCard[] = [];
    for (const row of data) {
      const record = row as Record<string, unknown>;
      const guideRole = typeof record.role === "string" ? record.role : "";
      if (!guideMatchesRole(guideRole, role)) continue;
      const experience = mapVaultExperienceRow({
        ...record,
        seller_id: record.seller_id ?? "00000000-0000-4000-8000-000000000000",
        status: "published",
        draft_step: 0,
        view_count: 0,
        sales_count: 0,
        created_at: record.created_at ?? new Date(0).toISOString(),
        updated_at: record.updated_at ?? new Date(0).toISOString(),
        rounds_data: record.rounds_data ?? [],
      });
      const publicItem = publicVaultListItem(experience);
      guides.push({
        id: publicItem.id,
        company: publicItem.company,
        role: publicItem.role,
        level: publicItem.level,
        difficulty: publicItem.difficulty,
        rounds: publicItem.rounds,
        avg_rating: publicItem.avg_rating,
        price_inr: publicItem.price_inr,
        href: `/interview-vault/${publicItem.id}`,
        preview: publicItem.preview,
      });
      if (guides.length >= 24) break;
    }

    return { role, guides };
  } catch {
    return { role, guides: [] };
  }
}
