"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Star, Unlock } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import VaultExperienceCard from "@/components/vault/VaultExperienceCard";
import { VaultEvidenceLabelChips } from "@/components/vault/VaultEvidenceLabels";
import VaultFreshness from "@/components/vault/VaultFreshness";
import VaultRefundForm from "@/components/vault/VaultRefundForm";
import VaultReportForm from "@/components/vault/VaultReportForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  VAULT_DIFFICULTY_LABELS,
  VAULT_RESULT_LABELS,
  type VaultExperience,
  type VaultExperienceListItem,
  type VaultReview,
} from "@/lib/vault";
import type { VaultEvidenceLabelPublic } from "@/lib/vault-evidence-labels";
import { formatInterviewMonthYear } from "@/lib/vault/freshness";
import type { VaultGuideOutlineSection } from "@/lib/vault/outline";
import type { VaultFreshnessDisplay } from "@/lib/vault/freshness";
import { VAULT_VERIFIED_PURCHASER_EXPLAINER } from "@/lib/vault/reviews";
import { VAULT_EVIDENCE_LABELS_DISCLAIMER } from "@/lib/vault-evidence-labels";
import {
  VAULT_REVIEW_REPORT_REASON_LABELS,
  VAULT_REVIEW_REPORT_REASONS,
  type VaultReviewReportReason,
} from "@/lib/vault/reports";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  experience: VaultExperience;
  preview: string;
  fullContent: string;
  unlocked: boolean;
  isOwner: boolean;
  initialReviews: VaultReview[];
  related: VaultExperienceListItem[];
  isLoggedIn: boolean;
  evidenceLabels: VaultEvidenceLabelPublic[];
  outline: VaultGuideOutlineSection[];
  freshness: VaultFreshnessDisplay;
  canReview: boolean;
  canRequestRefund: boolean;
  refundWindowDays: number;
};

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className="disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            className={`h-5 w-5 ${star <= value ? "fill-caution text-caution" : "text-muted-foreground"}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function VaultExperienceDetail({
  experience,
  preview,
  fullContent,
  unlocked: initialUnlocked,
  isOwner,
  initialReviews,
  related,
  isLoggedIn,
  evidenceLabels,
  outline,
  freshness,
  canReview,
  canRequestRefund,
  refundWindowDays,
}: Props) {
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const [purchasing, setPurchasing] = useState(false);
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");

  const interviewMonthYear = formatInterviewMonthYear(experience.interview_date);

  async function handleUnlock() {
    if (!isLoggedIn) {
      window.location.href = `/login?next=/interview-vault/${experience.id}`;
      return;
    }
    setPurchasing(true);
    try {
      const res = await fetch(`/api/vault/experiences/${experience.id}/purchase`, { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; unlocked?: boolean; error?: string };
      if (!res.ok || !data.unlocked) {
        throw new Error(data.error ?? "Payment verification is required before this content can be unlocked.");
      }
      setUnlocked(true);
      toast({
        title: "Unlocked",
        description: "You now have full access to this experience.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Could not unlock",
        description: err instanceof Error ? err.message : "Purchase failed",
        variant: "error",
      });
    } finally {
      setPurchasing(false);
    }
  }

  async function submitReview() {
    setSubmittingReview(true);
    setReviewStatus("");
    try {
      const res = await fetch(`/api/vault/experiences/${experience.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Review failed");
      setReviews((prev) => [data.review, ...prev.filter((r) => r.user_id !== data.review.user_id)]);
      setComment("");
      setEditingId(null);
      setReviewStatus("Review saved.");
      toast({ title: "Review saved", variant: "success" });
    } catch (err) {
      toast({
        title: "Review failed",
        description: err instanceof Error ? err.message : "Could not submit review",
        variant: "error",
      });
    } finally {
      setSubmittingReview(false);
    }
  }

  async function saveEditedReview(reviewId: string) {
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/vault/experiences/${experience.id}/reviews`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, rating, comment }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Update failed");
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? data.review : r)));
      setEditingId(null);
      setReviewStatus("Review updated.");
      toast({ title: "Review updated", variant: "success" });
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Could not update review",
        variant: "error",
      });
    } finally {
      setSubmittingReview(false);
    }
  }

  async function deleteReview(reviewId: string) {
    setSubmittingReview(true);
    try {
      const res = await fetch(
        `/api/vault/experiences/${experience.id}/reviews?reviewId=${encodeURIComponent(reviewId)}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Delete failed");
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setReviewStatus("Review deleted.");
      toast({ title: "Review deleted", variant: "success" });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Could not delete review",
        variant: "error",
      });
    } finally {
      setSubmittingReview(false);
    }
  }

  async function reportReview(reviewId: string) {
    if (!isLoggedIn) {
      window.location.href = `/login?next=/interview-vault/${experience.id}`;
      return;
    }
    if (!reportReason) {
      toast({ title: "Choose a reason", variant: "error" });
      return;
    }
    try {
      const res = await fetch(`/api/vault/reviews/${reviewId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Report failed");
      setReportingId(null);
      setReportReason("");
      toast({ title: "Review reported", description: data.message, variant: "success" });
    } catch (err) {
      toast({
        title: "Report failed",
        description: err instanceof Error ? err.message : "Could not report review",
        variant: "error",
      });
    }
  }

  const avgRating =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : experience.avg_rating;
  const ownReview = reviews.find((r) => r.is_own) ?? null;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{experience.company}</h1>
            <p className="text-lg text-muted-foreground">{experience.role}</p>
            {experience.level ? <p className="text-sm text-muted-foreground">{experience.level}</p> : null}
          </div>
          <Badge className="px-3 py-1 text-base">₹{experience.price_inr.toLocaleString("en-IN")}</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {experience.interview_round ? (
            <Badge variant="outline">{experience.interview_round}</Badge>
          ) : null}
          {experience.level ? <Badge variant="outline">{experience.level}</Badge> : null}
          {experience.difficulty ? (
            <Badge variant="outline">{VAULT_DIFFICULTY_LABELS[experience.difficulty]}</Badge>
          ) : null}
          {experience.rounds != null ? <Badge variant="outline">{experience.rounds} rounds</Badge> : null}
          {experience.result ? <Badge variant="outline">{VAULT_RESULT_LABELS[experience.result]}</Badge> : null}
          {interviewMonthYear ? <Badge variant="outline">Interview {interviewMonthYear}</Badge> : null}
        </div>

        <VaultFreshness
          lastConfirmedLabel={freshness.lastConfirmedLabel ?? "Confirmation date not available"}
          stale={freshness.stale}
          staleLabel={freshness.staleLabel}
        />

        <VaultEvidenceLabelChips labels={evidenceLabels} />
        <p className="text-xs text-muted-foreground">{VAULT_EVIDENCE_LABELS_DISCLAIMER}</p>
      </header>

      {outline.length > 0 ? (
        <section aria-labelledby="outline-heading" className="space-y-2">
          <h2 id="outline-heading" className="text-lg font-semibold">
            What&apos;s inside
          </h2>
          <p className="text-xs text-muted-foreground">
            Section titles only. Locked guide content is not shown in this outline.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {outline.map((section) => (
              <li key={section.title}>{section.title}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            Preview
            {!unlocked ? (
              <Lock className={iconClass("inline", "text-muted-foreground")} />
            ) : (
              <Unlock className={iconClass("inline", "text-positive")} />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{preview || "No preview available."}</p>

          {unlocked ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none border-t pt-4"
              dangerouslySetInnerHTML={{ __html: fullContent }}
            />
          ) : (
            <div className="relative overflow-hidden rounded-lg border bg-muted/30 p-6">
              <p className="select-none text-sm leading-relaxed text-muted-foreground blur-sm" aria-hidden>
                {preview}
              </p>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-t from-background via-background/90 to-transparent">
                <Lock className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Premium content locked</p>
                {!isOwner ? (
                  <Button onClick={() => void handleUnlock()} disabled={purchasing}>
                    {purchasing ? "Processing…" : `Unlock for ₹${experience.price_inr.toLocaleString("en-IN")}`}
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">You own this listing</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <section aria-labelledby="reviews-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="reviews-heading" className="text-lg font-semibold">
            Verified-purchaser reviews
          </h2>
          {avgRating != null ? (
            <span className="flex items-center gap-1 text-sm">
              <Star className={iconClass("inline", "fill-caution text-caution")} />
              {avgRating.toFixed(1)} ({reviews.length})
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">{VAULT_VERIFIED_PURCHASER_EXPLAINER}</p>
        {reviewStatus ? (
          <p className="text-sm text-positive" role="status" aria-live="polite">
            {reviewStatus}
          </p>
        ) : null}

        {canReview ? (
          <Card>
            <CardContent className="space-y-3 p-4">
              <Label htmlFor="review-comment">{ownReview ? "Edit your review" : "Write a review"}</Label>
              <StarRating value={rating} onChange={setRating} />
              <Textarea
                id="review-comment"
                placeholder="Share what was helpful. Do not discuss job-offer outcomes."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={2000}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() =>
                    void (editingId ? saveEditedReview(editingId) : submitReview())
                  }
                  disabled={submittingReview}
                >
                  {submittingReview
                    ? "Saving review…"
                    : editingId || ownReview
                      ? "Save review changes"
                      : "Submit review"}
                </Button>
                {ownReview ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={submittingReview}
                    onClick={() => {
                      setEditingId(ownReview.id);
                      setRating(ownReview.rating);
                      setComment(ownReview.comment ?? "");
                    }}
                  >
                    Load my review to edit
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {reviews.length > 0 ? (
          <ul className="space-y-3">
            {reviews.map((review) => (
              <li key={review.id}>
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StarRating value={review.rating} />
                      {review.verified_purchaser ? (
                        <Badge variant="outline">Verified purchaser</Badge>
                      ) : null}
                      {review.hidden && review.is_own ? (
                        <Badge variant="outline">Hidden from public</Badge>
                      ) : null}
                    </div>
                    {review.comment ? <p className="text-sm text-muted-foreground">{review.comment}</p> : null}
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                      {review.updated_at && review.updated_at !== review.created_at
                        ? ` · Updated ${new Date(review.updated_at).toLocaleDateString()}`
                        : ""}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {review.is_own ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={submittingReview}
                          onClick={() => void deleteReview(review.id)}
                        >
                          Delete my review
                        </Button>
                      ) : isLoggedIn ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setReportingId(reportingId === review.id ? null : review.id)}
                        >
                          {reportingId === review.id ? "Cancel report" : "Report review"}
                        </Button>
                      ) : null}
                    </div>
                    {reportingId === review.id ? (
                      <div className="space-y-2 rounded-lg border p-3">
                        <Label htmlFor={`review-report-${review.id}`}>Report reason</Label>
                        <Select value={reportReason} onValueChange={setReportReason}>
                          <SelectTrigger id={`review-report-${review.id}`}>
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                          <SelectContent>
                            {VAULT_REVIEW_REPORT_REASONS.map((value) => (
                              <SelectItem key={value} value={value}>
                                {VAULT_REVIEW_REPORT_REASON_LABELS[value as VaultReviewReportReason]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" size="sm" onClick={() => void reportReview(review.id)}>
                          Submit review report
                        </Button>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground" role="status">
            No reviews yet.
          </p>
        )}
      </section>

      <VaultReportForm experienceId={experience.id} isLoggedIn={isLoggedIn} />
      <VaultRefundForm
        experienceId={experience.id}
        isLoggedIn={isLoggedIn}
        canRequest={canRequestRefund}
        windowDays={refundWindowDays}
      />

      {related.length > 0 ? (
        <section aria-labelledby="related-heading" className="space-y-4">
          <h2 id="related-heading" className="text-lg font-semibold">
            Related experiences
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {related.map((exp) => (
              <li key={exp.id}>
                <VaultExperienceCard experience={exp} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/interview-vault" className="text-primary hover:underline">
          ← Back to marketplace
        </Link>
      </p>
    </div>
  );
}
