import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/session-server";
import {
  buildFullContent,
  buildPreviewContent,
  isVaultDifficulty,
  isVaultResult,
  mapVaultExperienceRow,
  mapVaultReviewRow,
  parseVaultPaymentStatus,
  publicVaultListItem,
  redactVaultExperience,
  VAULT_LIST_SELECT,
  type VaultDashboardStats,
  type VaultExperience,
  type VaultExperienceInsert,
  type VaultExperienceListItem,
  type VaultListFilters,
  type VaultReview,
} from "@/lib/vault";
import { requireAttestationForPublish, VAULT_ATTESTATION_VERSION } from "@/lib/vault/attestation";
import {
  filterAndSortVaultBrowse,
  type VaultBrowseItem,
} from "@/lib/vault/filters";
import {
  isVaultReportReason,
  isVaultReportStatus,
  reportStatusRemovesGuide,
  VAULT_REPORT_DETAILS_MAX,
  type VaultReportReason,
  type VaultReportStatus,
} from "@/lib/vault/reports";
import { recordEvent } from "@/lib/metrics/record";
import { hasVaultEntitlement, isVaultListingFree } from "@/lib/security/vault-entitlement";
import { logRouteError } from "@/lib/security/log";
import { createServerSupabaseClient } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase-enabled";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

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
  return publicVaultListItem(mapVaultExperienceRow(row));
}

function toBrowseItem(item: VaultExperienceListItem): VaultBrowseItem {
  return {
    id: item.id,
    company: item.company,
    role: item.role,
    level: item.level,
    interview_round: item.interview_round,
    skills: item.skills,
    difficulty: item.difficulty,
    rounds: item.rounds,
    result: item.result,
    interview_date: item.interview_date,
    published_at: item.published_at,
    updated_at: item.updated_at,
    content_confirmed_at: item.content_confirmed_at,
    avg_rating: item.avg_rating,
    sales_count: item.sales_count,
  };
}

export async function listPublishedExperiences(filters: VaultListFilters = {}): Promise<VaultExperienceListItem[]> {
  const { supabase } = await optionalUser();

  let query = supabase
    .from("vault_experiences")
    .select(VAULT_LIST_SELECT)
    .eq("status", "published")
    .is("removed_at", null)
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
  if (error) {
    logRouteError("vault/list", error);
    throw new VaultApiError("Could not load experiences.", 500);
  }

  const items = (data ?? []).map((row) => mapListItem(row as Record<string, unknown>));
  const sortedIds = filterAndSortVaultBrowse(
    items.map(toBrowseItem),
    {
      q: filters.q,
      company: filters.company,
      role: filters.role,
      interview_round: filters.interview_round,
      difficulty: filters.difficulty,
      rounds: filters.rounds,
      result: filters.result,
      date_from: filters.date_from,
      date_to: filters.date_to,
      sort: filters.sort,
    },
  ).map((row) => row.id);

  const byId = new Map(items.map((item) => [item.id, item]));
  return sortedIds.map((id) => byId.get(id)).filter((item): item is VaultExperienceListItem => Boolean(item));
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

export async function getVaultPurchase(
  experienceId: string,
  userId: string,
): Promise<{ payment_status: ReturnType<typeof parseVaultPaymentStatus> } | null> {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("vault_purchases")
    .select("id, payment_status")
    .eq("experience_id", experienceId)
    .eq("buyer_id", userId)
    .maybeSingle();
  if (error) {
    logRouteError("vault/purchase-lookup", error);
    return null;
  }
  if (!data) return null;
  return { payment_status: parseVaultPaymentStatus((data as { payment_status?: unknown }).payment_status) };
}

export async function userHasPurchased(experienceId: string, userId: string): Promise<boolean> {
  const purchase = await getVaultPurchase(experienceId, userId);
  return purchase?.payment_status === "verified";
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
  const purchase = user ? await getVaultPurchase(id, user.id) : null;
  const unlocked = hasVaultEntitlement({
    viewerId: user?.id ?? null,
    sellerId: experience.seller_id,
    priceInr: experience.price_inr,
    purchase,
  });

  // Removed guides leave browse/matches. Interim: owner + entitled purchasers may still open by ID.
  // Refunds / permanent purchaser access remain an open product/legal decision.
  if (experience.removed_at && !is_owner && !unlocked) {
    return null;
  }

  if (experience.status === "published" && !experience.removed_at) {
    await incrementViewCount(id);
  }

  const rawFull = buildFullContent(experience);
  const preview = buildPreviewContent(rawFull);
  const full_content = unlocked ? rawFull : "";
  const publicExperience = unlocked ? experience : redactVaultExperience(experience);

  return { experience: publicExperience, preview, full_content, unlocked, is_owner };
}

export type VaultPurchaseResult = {
  ok: true;
  unlocked: boolean;
  payment_status: "pending" | "verified";
  entitlement: "granted" | "pending";
  message: string;
};

export async function createDraftExperience(input: VaultExperienceInsert = {}): Promise<VaultExperience> {
  const { user, supabase } = await requireUser();

  const skills = Array.isArray(input.skills)
    ? input.skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 40)
    : [];

  const { data, error } = await supabase
    .from("vault_experiences")
    .insert({
      seller_id: user.id,
      company: input.company?.trim() ?? "",
      role: input.role?.trim() ?? "",
      level: input.level?.trim() || null,
      interview_round: input.interview_round?.trim() || null,
      skills,
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
  if (input.interview_round !== undefined) patch.interview_round = input.interview_round?.trim() || null;
  if (input.skills !== undefined) {
    patch.skills = input.skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 40);
  }
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
    if (input.status === "published") {
      const attestation = requireAttestationForPublish({
        attestationAccepted: Boolean(input.attestation_accepted),
        attestationVersion: input.attestation_version ?? VAULT_ATTESTATION_VERSION,
      });
      if (!attestation.ok) {
        throw new VaultApiError(attestation.error, 400);
      }
      const nowIso = new Date().toISOString();
      patch.status = input.status;
      patch.published_at = nowIso;
      patch.content_confirmed_at = nowIso;
      patch.attestation_accepted_at = nowIso;
      patch.attestation_version = attestation.version;
      if (!patch.interview_round && Array.isArray(input.rounds_data) && input.rounds_data[0]?.name) {
        patch.interview_round = String(input.rounds_data[0].name).trim().slice(0, 120) || null;
      }
    } else {
      patch.status = input.status;
    }
  }

  const { data, error } = await supabase.from("vault_experiences").update(patch).eq("id", id).select("*").single();
  if (error) throw new VaultApiError(error.message, 500);
  return mapVaultExperienceRow(data as Record<string, unknown>);
}

/** Owner-only: mark guide content as currently accurate (freshness). */
export async function confirmExperienceContent(id: string): Promise<VaultExperience> {
  const { user, supabase } = await requireUser();

  const { data: existing, error: fetchError } = await supabase
    .from("vault_experiences")
    .select("seller_id, status, removed_at")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw new VaultApiError(fetchError.message, 500);
  if (!existing || (existing as { seller_id: string }).seller_id !== user.id) {
    throw new VaultApiError("Experience not found", 404);
  }
  if ((existing as { status: string }).status !== "published") {
    throw new VaultApiError("Only published guides can be marked current.", 400);
  }
  if ((existing as { removed_at: string | null }).removed_at) {
    throw new VaultApiError("This guide was removed from the marketplace.", 400);
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("vault_experiences")
    .update({ content_confirmed_at: nowIso })
    .eq("id", id)
    .eq("seller_id", user.id)
    .select("*")
    .single();

  if (error) throw new VaultApiError(error.message, 500);
  return mapVaultExperienceRow(data as Record<string, unknown>);
}

export async function submitVaultGuideReport(input: {
  experienceId: string;
  reason: string;
  details?: string | null;
}): Promise<{ id: string }> {
  const { user, supabase } = await requireUser();

  if (!isVaultReportReason(input.reason)) {
    throw new VaultApiError("Choose a valid report reason.", 400);
  }
  const details = input.details?.trim() || null;
  if (details && details.length > VAULT_REPORT_DETAILS_MAX) {
    throw new VaultApiError("Report details are too long.", 400);
  }
  if (details && /@/.test(details)) {
    throw new VaultApiError("Do not include email addresses in a report.", 400);
  }

  const experience = await getExperienceById(input.experienceId);
  if (!experience || experience.status !== "published" || experience.removed_at) {
    throw new VaultApiError("Guide not found.", 404);
  }

  const { data, error } = await supabase
    .from("vault_guide_reports")
    .insert({
      experience_id: input.experienceId,
      reporter_id: user.id,
      reason: input.reason as VaultReportReason,
      details,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    logRouteError("vault/report", error);
    throw new VaultApiError("Could not submit report.", 500);
  }

  void recordEvent("vault_report_submitted", user.id, { reason: input.reason });

  return { id: String((data as { id: string }).id) };
}

export async function adminUpdateVaultGuideReportStatus(input: {
  reportId: string;
  status: string;
  actorUserId: string;
}): Promise<{ id: string; status: VaultReportStatus; experience_id: string }> {
  if (!isVaultReportStatus(input.status)) {
    throw new VaultApiError("Invalid report status.", 400);
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new VaultApiError("Admin tools are unavailable.", 503);
  }

  const { data: report, error: fetchError } = await admin
    .from("vault_guide_reports")
    .select("id, experience_id, status")
    .eq("id", input.reportId)
    .maybeSingle();

  if (fetchError) {
    logRouteError("vault/admin-report-lookup", fetchError);
    throw new VaultApiError("Could not update report.", 500);
  }
  if (!report) {
    throw new VaultApiError("Report not found.", 404);
  }

  const nowIso = new Date().toISOString();
  const nextStatus = input.status as VaultReportStatus;
  const { data, error } = await admin
    .from("vault_guide_reports")
    .update({
      status: nextStatus,
      resolved_at: nextStatus === "open" ? null : nowIso,
      resolved_by: nextStatus === "open" ? null : input.actorUserId,
    })
    .eq("id", input.reportId)
    .select("id, status, experience_id")
    .single();

  if (error || !data) {
    logRouteError("vault/admin-report-update", error ?? new Error("missing row"));
    throw new VaultApiError("Could not update report.", 500);
  }

  if (reportStatusRemovesGuide(nextStatus)) {
    const { error: removeError } = await admin
      .from("vault_experiences")
      .update({ removed_at: nowIso })
      .eq("id", (data as { experience_id: string }).experience_id)
      .is("removed_at", null);
    if (removeError) {
      logRouteError("vault/admin-remove-guide", removeError);
      throw new VaultApiError("Report updated but the guide could not be removed.", 500);
    }
  }

  return {
    id: String((data as { id: string }).id),
    status: nextStatus,
    experience_id: String((data as { experience_id: string }).experience_id),
  };
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

export async function purchaseExperience(experienceId: string): Promise<VaultPurchaseResult> {
  const { user, supabase } = await requireUser();

  const experience = await getExperienceById(experienceId);
  if (!experience || experience.status !== "published") {
    throw new VaultApiError("Experience not found", 404);
  }
  if (experience.seller_id === user.id) {
    throw new VaultApiError("You already own this experience", 400);
  }

  if (isVaultListingFree(experience.price_inr)) {
    await recordEvent("vault_purchased", user.id, { amount_inr: 0, free: true });
    return {
      ok: true,
      unlocked: true,
      payment_status: "verified",
      entitlement: "granted",
      message: "This listing is free.",
    };
  }

  const existing = await getVaultPurchase(experienceId, user.id);
  if (existing?.payment_status === "verified") {
    throw new VaultApiError("Already purchased", 400);
  }
  if (existing?.payment_status === "pending") {
    throw new VaultApiError(
      "Payment verification is required before this content can be unlocked.",
      402,
    );
  }

  const { error } = await supabase.from("vault_purchases").insert({
    experience_id: experienceId,
    buyer_id: user.id,
    amount_inr: experience.price_inr,
    payment_status: "pending",
  });

  if (error) {
    logRouteError("vault/purchase", error);
    throw new VaultApiError("Could not record purchase intent.", 500);
  }

  throw new VaultApiError(
    "Payment verification is required before this content can be unlocked.",
    402,
  );
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

  const experience = await getExperienceById(experienceId);
  if (!experience) throw new VaultApiError("Experience not found", 404);

  const purchase = await getVaultPurchase(experienceId, user.id);
  const entitled = hasVaultEntitlement({
    viewerId: user.id,
    sellerId: experience.seller_id,
    priceInr: experience.price_inr,
    purchase,
  });
  if (!entitled || experience.seller_id === user.id) {
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

const EMPTY_VAULT_HOME_STATS = {
  views: 0,
  earningsInr: 0,
  rating: 0,
  ratingCount: 0,
} as const;

export async function getVaultHomeStats(userId: string): Promise<{
  views: number;
  earningsInr: number;
  rating: number;
  ratingCount: number;
}> {
  try {
    const dashboard = await getSellerDashboard(userId);
    const supabase = await requireSupabase();

    const experienceIds = dashboard.experiences.map((exp) => exp.id);
    if (experienceIds.length === 0) {
      return { ...EMPTY_VAULT_HOME_STATS };
    }

    const { data, error } = await supabase
      .from("vault_reviews")
      .select("rating")
      .in("experience_id", experienceIds);

    if (error) return { ...EMPTY_VAULT_HOME_STATS };

    const ratings = (data ?? [])
      .map((row) => Number((row as { rating: number }).rating))
      .filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);

    const ratingCount = ratings.length;
    const rating = ratingCount > 0 ? ratings.reduce((sum, value) => sum + value, 0) / ratingCount : 0;

    return {
      views: dashboard.total_views,
      earningsInr: dashboard.total_earnings_inr,
      rating,
      ratingCount,
    };
  } catch {
    return { ...EMPTY_VAULT_HOME_STATS };
  }
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
