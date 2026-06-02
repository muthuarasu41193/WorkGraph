import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/session-server";
import {
  buildFullContent,
  buildPreviewContent,
  isVaultDifficulty,
  isVaultResult,
  mapVaultExperienceRow,
  mapVaultReviewRow,
  VAULT_LIST_SELECT,
  type VaultDashboardStats,
  type VaultExperience,
  type VaultExperienceInsert,
  type VaultExperienceListItem,
  type VaultListFilters,
  type VaultReview,
} from "@/lib/vault";
import { createServerSupabaseClient } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase-enabled";

export class VaultApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function requireSupabase() {
  if (!supabaseConfigured()) {
    throw new VaultApiError("Supabase is not configured", 503);
  }
  const supabase = createServerSupabaseClient(await cookies());
  return supabase;
}

async function optionalUser() {
  const user = await getSessionUser();
  const supabase = await requireSupabase();
  return { user, supabase };
}

async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new VaultApiError("Unauthorized", 401);
  const supabase = await requireSupabase();
  return { user, supabase };
}

function mapListItem(row: Record<string, unknown>): VaultExperienceListItem {
  const exp = mapVaultExperienceRow(row);
  return {
    id: exp.id,
    seller_id: exp.seller_id,
    company: exp.company,
    role: exp.role,
    level: exp.level,
    difficulty: exp.difficulty,
    rounds: exp.rounds,
    result: exp.result,
    interview_date: exp.interview_date,
    price_inr: exp.price_inr,
    view_count: exp.view_count,
    sales_count: exp.sales_count,
    avg_rating: exp.avg_rating,
    published_at: exp.published_at,
    questions_html: exp.questions_html,
    tips_html: exp.tips_html,
    rounds_data: exp.rounds_data,
  };
}

export async function listPublishedExperiences(filters: VaultListFilters = {}): Promise<VaultExperienceListItem[]> {
  const { supabase } = await optionalUser();

  let query = supabase
    .from("vault_experiences")
    .select(VAULT_LIST_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (filters.difficulty && isVaultDifficulty(filters.difficulty)) {
    query = query.eq("difficulty", filters.difficulty);
  }
  if (filters.rounds != null) {
    query = query.eq("rounds", filters.rounds);
  }
  if (filters.result && isVaultResult(filters.result)) {
    query = query.eq("result", filters.result);
  }
  if (filters.date_from) {
    query = query.gte("interview_date", filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte("interview_date", filters.date_to);
  }

  const { data, error } = await query;
  if (error) throw new VaultApiError(error.message, 500);

  let items = (data ?? []).map((row) => mapListItem(row as Record<string, unknown>));

  if (filters.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    items = items.filter(
      (item) =>
        item.company.toLowerCase().includes(q) ||
        item.role.toLowerCase().includes(q) ||
        (item.level?.toLowerCase().includes(q) ?? false),
    );
  }

  return items;
}

export async function getExperienceById(id: string): Promise<VaultExperience | null> {
  const { user, supabase } = await optionalUser();

  const { data, error } = await supabase.from("vault_experiences").select("*").eq("id", id).maybeSingle();
  if (error) throw new VaultApiError(error.message, 500);
  if (!data) return null;

  const experience = mapVaultExperienceRow(data as Record<string, unknown>);
  if (experience.status !== "published" && experience.seller_id !== user?.id) {
    return null;
  }
  return experience;
}

export async function userHasPurchased(experienceId: string, userId: string): Promise<boolean> {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("vault_purchases")
    .select("id")
    .eq("experience_id", experienceId)
    .eq("buyer_id", userId)
    .maybeSingle();
  if (error) throw new VaultApiError(error.message, 500);
  return Boolean(data);
}

export async function incrementViewCount(id: string): Promise<void> {
  const supabase = await requireSupabase();
  const { data } = await supabase.from("vault_experiences").select("view_count").eq("id", id).maybeSingle();
  if (!data) return;
  const next = Number((data as { view_count: number }).view_count ?? 0) + 1;
  await supabase.from("vault_experiences").update({ view_count: next }).eq("id", id);
}

export type VaultExperienceView = {
  experience: VaultExperience;
  preview: string;
  full_content: string;
  unlocked: boolean;
  is_owner: boolean;
};

export async function getExperienceView(id: string): Promise<VaultExperienceView | null> {
  const experience = await getExperienceById(id);
  if (!experience) return null;

  const user = await getSessionUser();
  const is_owner = user?.id === experience.seller_id;
  const purchased = user ? await userHasPurchased(id, user.id) : false;
  const unlocked = is_owner || purchased;

  if (experience.status === "published") {
    await incrementViewCount(id);
  }

  const full_content = buildFullContent(experience);
  const preview = buildPreviewContent(full_content);

  return { experience, preview, full_content, unlocked, is_owner };
}

export async function createDraftExperience(input: VaultExperienceInsert = {}): Promise<VaultExperience> {
  const { user, supabase } = await requireUser();

  const { data, error } = await supabase
    .from("vault_experiences")
    .insert({
      seller_id: user.id,
      company: input.company?.trim() ?? "",
      role: input.role?.trim() ?? "",
      level: input.level?.trim() || null,
      difficulty: input.difficulty ?? null,
      rounds: input.rounds ?? null,
      result: input.result ?? null,
      interview_date: input.interview_date ?? null,
      rounds_data: input.rounds_data ?? [],
      questions_html: input.questions_html ?? "",
      tips_html: input.tips_html ?? "",
      price_inr: input.price_inr ?? 499,
      status: "draft",
      draft_step: input.draft_step ?? 0,
    })
    .select("*")
    .single();

  if (error) throw new VaultApiError(error.message, 500);
  return mapVaultExperienceRow(data as Record<string, unknown>);
}

export async function updateExperienceForSeller(
  id: string,
  input: VaultExperienceInsert & { status?: "draft" | "published" | "archived" },
): Promise<VaultExperience> {
  const { user, supabase } = await requireUser();

  const { data: existing, error: fetchError } = await supabase
    .from("vault_experiences")
    .select("seller_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw new VaultApiError(fetchError.message, 500);
  if (!existing || (existing as { seller_id: string }).seller_id !== user.id) {
    throw new VaultApiError("Experience not found", 404);
  }

  const patch: Record<string, unknown> = {};
  if (input.company !== undefined) patch.company = input.company.trim();
  if (input.role !== undefined) patch.role = input.role.trim();
  if (input.level !== undefined) patch.level = input.level?.trim() || null;
  if (input.difficulty !== undefined) patch.difficulty = input.difficulty;
  if (input.rounds !== undefined) patch.rounds = input.rounds;
  if (input.result !== undefined) patch.result = input.result;
  if (input.interview_date !== undefined) patch.interview_date = input.interview_date;
  if (input.rounds_data !== undefined) patch.rounds_data = input.rounds_data;
  if (input.questions_html !== undefined) patch.questions_html = input.questions_html;
  if (input.tips_html !== undefined) patch.tips_html = input.tips_html;
  if (input.price_inr !== undefined) patch.price_inr = input.price_inr;
  if (input.draft_step !== undefined) patch.draft_step = input.draft_step;
  if (input.status !== undefined) {
    patch.status = input.status;
    if (input.status === "published") {
      patch.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase.from("vault_experiences").update(patch).eq("id", id).select("*").single();
  if (error) throw new VaultApiError(error.message, 500);
  return mapVaultExperienceRow(data as Record<string, unknown>);
}

export async function getSellerDraft(userId: string): Promise<VaultExperience | null> {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("vault_experiences")
    .select("*")
    .eq("seller_id", userId)
    .eq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new VaultApiError(error.message, 500);
  return data ? mapVaultExperienceRow(data as Record<string, unknown>) : null;
}

export async function purchaseExperience(experienceId: string): Promise<{ ok: true }> {
  const { user, supabase } = await requireUser();

  const experience = await getExperienceById(experienceId);
  if (!experience || experience.status !== "published") {
    throw new VaultApiError("Experience not found", 404);
  }
  if (experience.seller_id === user.id) {
    throw new VaultApiError("You already own this experience", 400);
  }

  const already = await userHasPurchased(experienceId, user.id);
  if (already) {
    throw new VaultApiError("Already purchased", 400);
  }

  const { error } = await supabase.from("vault_purchases").insert({
    experience_id: experienceId,
    buyer_id: user.id,
    amount_inr: experience.price_inr,
  });

  if (error) throw new VaultApiError(error.message, 500);
  return { ok: true };
}

export async function listReviewsForExperience(experienceId: string): Promise<VaultReview[]> {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("vault_reviews")
    .select("*")
    .eq("experience_id", experienceId)
    .order("created_at", { ascending: false });

  if (error) throw new VaultApiError(error.message, 500);
  return (data ?? []).map((row) => mapVaultReviewRow(row as Record<string, unknown>));
}

export async function submitReview(
  experienceId: string,
  rating: number,
  comment?: string,
): Promise<VaultReview> {
  const { user, supabase } = await requireUser();

  if (rating < 1 || rating > 5) {
    throw new VaultApiError("Rating must be between 1 and 5", 400);
  }

  const purchased = await userHasPurchased(experienceId, user.id);
  if (!purchased) {
    throw new VaultApiError("Purchase required to review", 403);
  }

  const { data, error } = await supabase
    .from("vault_reviews")
    .upsert(
      {
        experience_id: experienceId,
        user_id: user.id,
        rating,
        comment: comment?.trim() || null,
      },
      { onConflict: "experience_id,user_id" },
    )
    .select("*")
    .single();

  if (error) throw new VaultApiError(error.message, 500);
  return mapVaultReviewRow(data as Record<string, unknown>);
}

export async function getRelatedExperiences(
  experience: VaultExperience,
  limit = 4,
): Promise<VaultExperienceListItem[]> {
  const items = await listPublishedExperiences({ q: experience.company });
  return items.filter((item) => item.id !== experience.id).slice(0, limit);
}

export async function getSellerDashboard(userId: string): Promise<VaultDashboardStats> {
  const supabase = await requireSupabase();

  const { data: experiences, error: expError } = await supabase
    .from("vault_experiences")
    .select(VAULT_LIST_SELECT)
    .eq("seller_id", userId)
    .in("status", ["published", "draft"])
    .order("updated_at", { ascending: false });

  if (expError) throw new VaultApiError(expError.message, 500);

  const experienceIds = (experiences ?? []).map((e) => (e as { id: string }).id);

  let purchases: Array<{ experience_id: string; amount_inr: number; created_at: string }> = [];
  if (experienceIds.length > 0) {
    const { data, error } = await supabase
      .from("vault_purchases")
      .select("experience_id, amount_inr, created_at")
      .in("experience_id", experienceIds)
      .order("created_at", { ascending: true });

    if (error) throw new VaultApiError(error.message, 500);
    purchases = (data ?? []) as typeof purchases;
  }

  const earningsByExperience = new Map<string, number>();
  for (const p of purchases) {
    earningsByExperience.set(p.experience_id, (earningsByExperience.get(p.experience_id) ?? 0) + p.amount_inr);
  }

  const mapped = (experiences ?? []).map((row) => {
    const item = mapListItem(row as Record<string, unknown>);
    return { ...item, earnings_inr: earningsByExperience.get(item.id) ?? 0 };
  });

  const total_earnings_inr = purchases.reduce((sum, p) => sum + p.amount_inr, 0);
  const total_views = mapped.reduce((sum, e) => sum + e.view_count, 0);
  const total_sales = purchases.length;

  const salesByDayMap = new Map<string, { sales: number; earnings_inr: number }>();
  for (const p of purchases) {
    const date = p.created_at.slice(0, 10);
    const prev = salesByDayMap.get(date) ?? { sales: 0, earnings_inr: 0 };
    salesByDayMap.set(date, {
      sales: prev.sales + 1,
      earnings_inr: prev.earnings_inr + p.amount_inr,
    });
  }

  const sales_by_day = [...salesByDayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, stats]) => ({ date, ...stats }));

  return {
    total_earnings_inr,
    total_views,
    total_sales,
    experiences: mapped,
    sales_by_day,
  };
}

export async function requestVaultWithdrawal(userId: string): Promise<{ ok: true; message: string }> {
  const dashboard = await getSellerDashboard(userId);
  if (dashboard.total_earnings_inr < 500) {
    throw new VaultApiError("Minimum withdrawal is ₹500", 400);
  }
  return {
    ok: true,
    message: `Withdrawal request for ₹${dashboard.total_earnings_inr.toLocaleString("en-IN")} submitted. Payouts are processed within 5–7 business days.`,
  };
}
