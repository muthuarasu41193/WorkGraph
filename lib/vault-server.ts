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
import {
  deriveGuideEvidenceLabels,
  mapContributorVerificationRow,
  publicEvidenceLabelsOnly,
  type ContributorVerificationRecord,
  type VaultEvidenceLabelPublic,
} from "@/lib/vault-evidence-labels";
import { buildVaultGuideOutline, type VaultGuideOutlineSection } from "@/lib/vault/outline";
import { vaultFreshnessDisplay, type VaultFreshnessDisplay } from "@/lib/vault/freshness";
import {
  canTransitionRefundStatus,
  authorizeVaultRefundRequest,
  getVaultRefundWindowDays,
  isVaultRefundReason,
  isVaultRefundStatus,
  type VaultRefundReason,
  type VaultRefundStatus,
} from "@/lib/vault/refunds";
import {
  isVaultReportReason,
  isVaultReportStatus,
  isVaultReviewReportReason,
  reportStatusRemovesGuide,
  type VaultReportReason,
  type VaultReportStatus,
  type VaultReviewReportReason,
} from "@/lib/vault/reports";
import { authorizeVaultReviewWrite, validateVaultReviewInput } from "@/lib/vault/reviews";
import { recordEvent } from "@/lib/metrics/record";
import { hasVaultEntitlement, isVaultListingFree } from "@/lib/security/vault-entitlement";
import { logRouteError } from "@/lib/security/log";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase-enabled";

const VERIFICATION_SELECT =
  "contributor_id,experience_id,claim_type,status,method,verified_at,expires_at";

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

async function loadContributorVerifications(
  contributorIds: string[],
  experienceIds: string[] = [],
): Promise<ContributorVerificationRecord[]> {
  if (contributorIds.length === 0) return [];

  // RLS allows contributors to read only their own rows. Marketplace derivation
  // needs labels for every published seller, so read status fields via the
  // service-role client (never returns evidence — none is stored). Absence or
  // misconfiguration yields empty records → not_independently_verified.
  const admin = createSupabaseAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("contributor_verifications")
    .select(VERIFICATION_SELECT)
    .in("contributor_id", contributorIds);

  if (error) {
    logRouteError("vault/verifications", error);
    return [];
  }

  const rows = (data ?? []).map((row) => mapContributorVerificationRow(row as Record<string, unknown>));
  if (experienceIds.length === 0) return rows;

  const experienceSet = new Set(experienceIds);
  return rows.filter(
    (row) => row.experience_id == null || experienceSet.has(row.experience_id),
  );
}

function labelsForGuide(
  experience: VaultExperience,
  records: readonly ContributorVerificationRecord[],
): VaultEvidenceLabelPublic[] {
  return publicEvidenceLabelsOnly(
    deriveGuideEvidenceLabels({
      guide: {
        id: experience.id,
        seller_id: experience.seller_id,
        result: experience.result,
      },
      records,
    }),
  );
}

function mapListItem(
  row: Record<string, unknown>,
  records: readonly ContributorVerificationRecord[] = [],
): VaultExperienceListItem {
  const experience = mapVaultExperienceRow(row);
  return publicVaultListItem(experience, labelsForGuide(experience, records));
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

  const rows = (data ?? []) as Record<string, unknown>[];
  const experiences = rows.map((row) => mapVaultExperienceRow(row));
  const contributorIds = [...new Set(experiences.map((e) => e.seller_id))];
  const experienceIds = experiences.map((e) => e.id);
  const records = await loadContributorVerifications(contributorIds, experienceIds);

  let items = rows.map((row) => mapListItem(row, records));

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

export type VaultPurchaseLookup = {
  id: string;
  payment_status: ReturnType<typeof parseVaultPaymentStatus>;
  created_at: string;
};

export async function getVaultPurchase(
  experienceId: string,
  userId: string,
): Promise<VaultPurchaseLookup | null> {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("vault_purchases")
    .select("id, payment_status, created_at")
    .eq("experience_id", experienceId)
    .eq("buyer_id", userId)
    .maybeSingle();
  if (error) {
    logRouteError("vault/purchase-lookup", error);
    return null;
  }
  if (!data) return null;
  return {
    id: String((data as { id: string }).id),
    payment_status: parseVaultPaymentStatus((data as { payment_status?: unknown }).payment_status),
    created_at: String((data as { created_at: string }).created_at),
  };
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
  evidence_labels: VaultEvidenceLabelPublic[];
  outline: VaultGuideOutlineSection[];
  freshness: VaultFreshnessDisplay;
  can_review: boolean;
  can_request_refund: boolean;
  refund_window_days: number;
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

  // Removed guides: entitled purchasers and owner may still open by ID.
  if (experience.removed_at && !is_owner && !unlocked) {
    return null;
  }

  if (experience.status === "published" && !experience.removed_at) {
    await incrementViewCount(id);
  }

  const records = await loadContributorVerifications([experience.seller_id], [experience.id]);
  const evidence_labels = labelsForGuide(experience, records);

  // Outline from full metadata before redaction; titles only.
  const outline = buildVaultGuideOutline(experience);
  const freshness = vaultFreshnessDisplay({
    updatedAt: experience.updated_at,
    contentConfirmedAt: experience.content_confirmed_at ?? experience.published_at,
  });

  const reviewAuth = authorizeVaultReviewWrite({
    userId: user?.id,
    sellerId: experience.seller_id,
    priceInr: experience.price_inr,
    purchase,
  });

  let can_request_refund = false;
  if (user && purchase) {
    const supabase = await requireSupabase();
    const { data: existingRefund } = await supabase
      .from("vault_refund_requests")
      .select("id")
      .eq("purchase_id", purchase.id)
      .maybeSingle();
    const refundAuth = authorizeVaultRefundRequest({
      userId: user.id,
      sellerId: experience.seller_id,
      purchase,
      existingRequest: Boolean(existingRefund),
    });
    can_request_refund = refundAuth.allowed;
  }

  const rawFull = buildFullContent(experience);
  const preview = buildPreviewContent(rawFull);
  const full_content = unlocked ? rawFull : "";
  const publicExperience = unlocked ? experience : redactVaultExperience(experience);

  return {
    experience: publicExperience,
    preview,
    full_content,
    unlocked,
    is_owner,
    evidence_labels,
    outline,
    freshness,
    can_review: reviewAuth.allowed,
    can_request_refund,
    refund_window_days: getVaultRefundWindowDays(),
  };
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
  const user = await getSessionUser();
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("vault_reviews")
    .select("id, experience_id, user_id, rating, comment, created_at, updated_at, purchase_id, hidden_at")
    .eq("experience_id", experienceId)
    .order("created_at", { ascending: false });

  if (error) throw new VaultApiError(error.message, 500);
  return (data ?? [])
    .map((row) => mapVaultReviewRow(row as Record<string, unknown>, { viewerId: user?.id }))
    .filter((review) => !review.hidden || review.is_own);
}

export async function submitReview(
  experienceId: string,
  rating: number,
  comment?: string,
): Promise<VaultReview> {
  const { user, supabase } = await requireUser();

  const validated = validateVaultReviewInput({ rating, comment });
  if (!validated.ok) throw new VaultApiError(validated.error, 400);

  const experience = await getExperienceById(experienceId);
  if (!experience) throw new VaultApiError("Experience not found", 404);

  const purchase = await getVaultPurchase(experienceId, user.id);
  const auth = authorizeVaultReviewWrite({
    userId: user.id,
    sellerId: experience.seller_id,
    priceInr: experience.price_inr,
    purchase,
  });
  if (!auth.allowed) throw new VaultApiError(auth.error, auth.status);

  const { data: existing } = await supabase
    .from("vault_reviews")
    .select("id")
    .eq("purchase_id", auth.purchaseId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("vault_reviews")
      .update({
        rating: validated.rating,
        comment: validated.comment,
      })
      .eq("id", (existing as { id: string }).id)
      .eq("user_id", user.id)
      .select("id, experience_id, user_id, rating, comment, created_at, updated_at, purchase_id, hidden_at")
      .single();
    if (error) throw new VaultApiError(error.message, 500);
    return mapVaultReviewRow(data as Record<string, unknown>, { viewerId: user.id });
  }

  const { data, error } = await supabase
    .from("vault_reviews")
    .insert({
      experience_id: experienceId,
      user_id: user.id,
      purchase_id: auth.purchaseId,
      rating: validated.rating,
      comment: validated.comment,
    })
    .select("id, experience_id, user_id, rating, comment, created_at, updated_at, purchase_id, hidden_at")
    .single();

  if (error) {
    if (String(error.message).toLowerCase().includes("duplicate") || error.code === "23505") {
      throw new VaultApiError("Only one review is allowed per purchase.", 409);
    }
    throw new VaultApiError(error.message, 500);
  }
  return mapVaultReviewRow(data as Record<string, unknown>, { viewerId: user.id });
}

export async function updateOwnReview(
  experienceId: string,
  reviewId: string,
  rating: number,
  comment?: string,
): Promise<VaultReview> {
  const { user, supabase } = await requireUser();
  const validated = validateVaultReviewInput({ rating, comment });
  if (!validated.ok) throw new VaultApiError(validated.error, 400);

  const { data, error } = await supabase
    .from("vault_reviews")
    .update({
      rating: validated.rating,
      comment: validated.comment,
    })
    .eq("id", reviewId)
    .eq("experience_id", experienceId)
    .eq("user_id", user.id)
    .is("hidden_at", null)
    .select("id, experience_id, user_id, rating, comment, created_at, updated_at, purchase_id, hidden_at")
    .maybeSingle();

  if (error) throw new VaultApiError(error.message, 500);
  if (!data) throw new VaultApiError("Review not found", 404);
  return mapVaultReviewRow(data as Record<string, unknown>, { viewerId: user.id });
}

export async function deleteOwnReview(experienceId: string, reviewId: string): Promise<void> {
  const { user, supabase } = await requireUser();
  const { data, error } = await supabase
    .from("vault_reviews")
    .delete()
    .eq("id", reviewId)
    .eq("experience_id", experienceId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) throw new VaultApiError(error.message, 500);
  if (!data) throw new VaultApiError("Review not found", 404);
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

  const experience = await getExperienceById(input.experienceId);
  if (!experience || experience.status !== "published" || experience.removed_at) {
    throw new VaultApiError("Guide not found", 404);
  }

  const details = input.details?.trim() || null;
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
  if (!admin) throw new VaultApiError("Admin tools are unavailable.", 503);

  const { data: report, error: fetchError } = await admin
    .from("vault_guide_reports")
    .select("id, experience_id, status")
    .eq("id", input.reportId)
    .maybeSingle();

  if (fetchError) {
    logRouteError("vault/admin-report-lookup", fetchError);
    throw new VaultApiError("Could not update report.", 500);
  }
  if (!report) throw new VaultApiError("Report not found.", 404);

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

export async function submitVaultReviewReport(input: {
  reviewId: string;
  reason: string;
  details?: string | null;
}): Promise<{ id: string }> {
  const { user, supabase } = await requireUser();
  if (!isVaultReviewReportReason(input.reason)) {
    throw new VaultApiError("Choose a valid report reason.", 400);
  }

  const { data: review, error: reviewError } = await supabase
    .from("vault_reviews")
    .select("id, user_id, hidden_at")
    .eq("id", input.reviewId)
    .maybeSingle();
  if (reviewError) throw new VaultApiError("Could not submit report.", 500);
  if (!review || (review as { hidden_at: string | null }).hidden_at) {
    throw new VaultApiError("Review not found", 404);
  }
  if ((review as { user_id: string }).user_id === user.id) {
    throw new VaultApiError("You cannot report your own review.", 403);
  }

  const { data, error } = await supabase
    .from("vault_review_reports")
    .insert({
      review_id: input.reviewId,
      reporter_id: user.id,
      reason: input.reason as VaultReviewReportReason,
      details: input.details?.trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new VaultApiError("You already reported this review.", 409);
    }
    logRouteError("vault/review-report", error);
    throw new VaultApiError("Could not submit report.", 500);
  }

  void recordEvent("vault_review_reported", user.id, { reason: input.reason });
  return { id: String((data as { id: string }).id) };
}

export async function adminHideVaultReview(input: {
  reviewId: string;
  hidden: boolean;
  actorUserId: string;
}): Promise<{ id: string; hidden: boolean }> {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new VaultApiError("Admin tools are unavailable.", 503);

  const patch = input.hidden
    ? { hidden_at: new Date().toISOString(), hidden_by: input.actorUserId }
    : { hidden_at: null, hidden_by: null };

  const { data, error } = await admin
    .from("vault_reviews")
    .update(patch)
    .eq("id", input.reviewId)
    .select("id, hidden_at")
    .maybeSingle();

  if (error) {
    logRouteError("vault/admin-hide-review", error);
    throw new VaultApiError("Could not update review.", 500);
  }
  if (!data) throw new VaultApiError("Review not found.", 404);
  return {
    id: String((data as { id: string }).id),
    hidden: (data as { hidden_at: string | null }).hidden_at != null,
  };
}

export type VaultRefundRequestPublic = {
  id: string;
  experience_id: string;
  purchase_id: string;
  reason: VaultRefundReason;
  details: string | null;
  status: VaultRefundStatus;
  processing_mode: "manual";
  contributor_response: string | null;
  contributor_responded_at: string | null;
  created_at: string;
  resolved_at: string | null;
};

function mapRefundRow(row: Record<string, unknown>): VaultRefundRequestPublic {
  return {
    id: String(row.id),
    experience_id: String(row.experience_id),
    purchase_id: String(row.purchase_id),
    reason: row.reason as VaultRefundReason,
    details: row.details != null ? String(row.details) : null,
    status: row.status as VaultRefundStatus,
    processing_mode: "manual",
    contributor_response: row.contributor_response != null ? String(row.contributor_response) : null,
    contributor_responded_at:
      row.contributor_responded_at != null ? String(row.contributor_responded_at) : null,
    created_at: String(row.created_at),
    resolved_at: row.resolved_at != null ? String(row.resolved_at) : null,
  };
}

export async function createVaultRefundRequest(input: {
  experienceId: string;
  reason: string;
  details?: string | null;
}): Promise<VaultRefundRequestPublic> {
  const { user, supabase } = await requireUser();
  if (!isVaultRefundReason(input.reason)) {
    throw new VaultApiError("Choose a valid refund reason.", 400);
  }

  const experience = await getExperienceById(input.experienceId);
  if (!experience) throw new VaultApiError("Guide not found", 404);

  const purchase = await getVaultPurchase(input.experienceId, user.id);
  const { data: existing } = await supabase
    .from("vault_refund_requests")
    .select("id")
    .eq("purchase_id", purchase?.id ?? "00000000-0000-0000-0000-000000000000")
    .maybeSingle();

  const auth = authorizeVaultRefundRequest({
    userId: user.id,
    sellerId: experience.seller_id,
    purchase,
    existingRequest: Boolean(existing),
  });
  if (!auth.allowed) throw new VaultApiError(auth.error, auth.status);
  if (!purchase) throw new VaultApiError("A verified purchase is required to request a refund.", 403);

  const { data, error } = await supabase
    .from("vault_refund_requests")
    .insert({
      experience_id: input.experienceId,
      buyer_id: user.id,
      purchase_id: purchase.id,
      reason: input.reason,
      details: input.details?.trim() || null,
      status: "open",
      processing_mode: "manual",
    })
    .select(
      "id, experience_id, purchase_id, reason, details, status, processing_mode, contributor_response, contributor_responded_at, created_at, resolved_at",
    )
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new VaultApiError("A refund request already exists for this purchase.", 409);
    }
    logRouteError("vault/refund-request", error);
    throw new VaultApiError("Could not submit refund request.", 500);
  }

  void recordEvent("vault_refund_requested", user.id, { reason: input.reason });
  return mapRefundRow(data as Record<string, unknown>);
}

export async function respondToVaultRefundRequest(input: {
  requestId: string;
  response: string;
}): Promise<VaultRefundRequestPublic> {
  const { user, supabase } = await requireUser();
  const response = input.response.trim();
  if (!response) throw new VaultApiError("Response is required.", 400);

  const { data: existing, error: fetchError } = await supabase
    .from("vault_refund_requests")
    .select(
      "id, experience_id, purchase_id, reason, details, status, processing_mode, contributor_response, contributor_responded_at, created_at, resolved_at",
    )
    .eq("id", input.requestId)
    .maybeSingle();
  if (fetchError) throw new VaultApiError("Could not update refund request.", 500);
  if (!existing) throw new VaultApiError("Refund request not found.", 404);
  if ((existing as { status: string }).status !== "open") {
    throw new VaultApiError("Only open refund requests can receive a contributor response.", 400);
  }

  const experience = await getExperienceById(String((existing as { experience_id: string }).experience_id));
  if (!experience || experience.seller_id !== user.id) {
    throw new VaultApiError("Refund request not found.", 404);
  }

  const { data, error } = await supabase
    .from("vault_refund_requests")
    .update({
      contributor_response: response.slice(0, 2000),
      contributor_responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.requestId)
    .select(
      "id, experience_id, purchase_id, reason, details, status, processing_mode, contributor_response, contributor_responded_at, created_at, resolved_at",
    )
    .single();

  if (error) throw new VaultApiError("Could not update refund request.", 500);
  return mapRefundRow(data as Record<string, unknown>);
}

export async function adminUpdateVaultRefundStatus(input: {
  requestId: string;
  status: string;
  adminNote?: string | null;
  actorUserId: string;
}): Promise<VaultRefundRequestPublic> {
  if (!isVaultRefundStatus(input.status)) {
    throw new VaultApiError("Invalid refund status.", 400);
  }

  const admin = createSupabaseAdminClient();
  if (!admin) throw new VaultApiError("Admin tools are unavailable.", 503);

  const { data: existing, error: fetchError } = await admin
    .from("vault_refund_requests")
    .select("id, status")
    .eq("id", input.requestId)
    .maybeSingle();
  if (fetchError) throw new VaultApiError("Could not update refund request.", 500);
  if (!existing) throw new VaultApiError("Refund request not found.", 404);

  const from = (existing as { status: string }).status as VaultRefundStatus;
  const to = input.status as VaultRefundStatus;
  if (!canTransitionRefundStatus(from, to)) {
    throw new VaultApiError("That status transition is not allowed.", 400);
  }

  // Manual only: never call a payment provider or mutate earnings here.
  const nowIso = new Date().toISOString();
  const { data, error } = await admin
    .from("vault_refund_requests")
    .update({
      status: to,
      admin_note: input.adminNote?.trim() || null,
      updated_at: nowIso,
      resolved_at: to === "open" ? null : nowIso,
      resolved_by: to === "open" ? null : input.actorUserId,
    })
    .eq("id", input.requestId)
    .select(
      "id, experience_id, purchase_id, reason, details, status, processing_mode, contributor_response, contributor_responded_at, created_at, resolved_at",
    )
    .single();

  if (error) {
    logRouteError("vault/admin-refund", error);
    throw new VaultApiError("Could not update refund request.", 500);
  }
  return mapRefundRow(data as Record<string, unknown>);
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

  const sellerRows = (experiences ?? []) as Record<string, unknown>[];
  const sellerExperiences = sellerRows.map((row) => mapVaultExperienceRow(row));
  const verificationRecords = await loadContributorVerifications(
    [userId],
    sellerExperiences.map((e) => e.id),
  );

  const mapped = sellerRows.map((row) => {
    const item = mapListItem(row, verificationRecords);
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
