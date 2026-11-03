"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { Lock, Star, Unlock } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import VaultExperienceCard from "@/components/vault/VaultExperienceCard";
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

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
const REFUND_TERMS_HREF = "/legal/terms#payments-and-refunds";

type Props = {
  experience: VaultExperience;
  preview: string;
  fullContent: string;
  unlocked: boolean;
  isOwner: boolean;
  initialReviews: VaultReview[];
  related: VaultExperienceListItem[];
  isLoggedIn: boolean;
};

type CheckoutPayload = {
  kind?: string;
  experienceId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
};

type RazorpaySuccess = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: () => void) => void;
};

type RazorpayCheckout = {
  Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
};

function checkoutCtor(): RazorpayCheckout["Razorpay"] | undefined {
  return (window as Window & RazorpayCheckout).Razorpay;
}

async function waitForCheckout(timeoutMs: number): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (checkoutCtor()) return true;
    await new Promise((resolve) => {
      window.setTimeout(resolve, 50);
    });
  }
  return Boolean(checkoutCtor());
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className="disabled:cursor-default"
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
}: Props) {
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const [purchasing, setPurchasing] = useState(false);
  const [loadScript, setLoadScript] = useState(false);
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  async function verifyPayment(response: RazorpaySuccess) {
    const res = await fetch("/api/billing/razorpay/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; unlocked?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      throw new Error(typeof data.error === "string" ? data.error : "Payment could not be verified.");
    }
    setUnlocked(true);
    toast({
      title: "Unlocked!",
      description: "You now have full access to this experience.",
      variant: "success",
    });
    window.location.reload();
  }

  function openCheckout(checkout: CheckoutPayload) {
    const Ctor = checkoutCtor();
    if (!Ctor || !checkout.orderId || !checkout.keyId || checkout.amount == null || !checkout.currency) {
      throw new Error("Checkout could not load. Try again.");
    }
    const expectedPaise = Math.round(experience.price_inr * 100);
    if (checkout.amount !== expectedPaise || checkout.currency !== "INR") {
      throw new Error("Checkout could not be started.");
    }
    const instance = new Ctor({
      key: checkout.keyId,
      amount: checkout.amount,
      currency: checkout.currency,
      name: "WorkGraph",
      description: `${experience.company} — ${experience.role}`,
      order_id: checkout.orderId,
      handler: (response: RazorpaySuccess) => {
        void verifyPayment(response).finally(() => setPurchasing(false));
      },
      modal: {
        ondismiss: () => setPurchasing(false),
      },
    });
    instance.on("payment.failed", () => {
      toast({
        title: "Could not unlock",
        description: "Payment was not completed.",
        variant: "error",
      });
      setPurchasing(false);
    });
    instance.open();
  }

  async function handleUnlock() {
    if (!isLoggedIn) {
      window.location.href = `/login?next=/interview-vault/${experience.id}`;
      return;
    }
    setPurchasing(true);
    setLoadScript(true);
    try {
      const [res] = await Promise.all([
        fetch(`/api/vault/experiences/${experience.id}/purchase`, { method: "POST" }),
        waitForCheckout(8000),
      ]);
      const data = (await res.json()) as {
        ok?: boolean;
        unlocked?: boolean;
        error?: string;
        checkout?: CheckoutPayload;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not start checkout.");
      }
      if (data.unlocked) {
        setUnlocked(true);
        toast({
          title: "Unlocked!",
          description: "You now have full access to this experience.",
          variant: "success",
        });
        window.location.reload();
        return;
      }
      if (!data.checkout) {
        throw new Error(data.error ?? "Payment verification is required before this content can be unlocked.");
      }
      openCheckout(data.checkout);
    } catch (err) {
      toast({
        title: "Could not unlock",
        description: err instanceof Error ? err.message : "Purchase failed",
        variant: "error",
      });
      setPurchasing(false);
    }
  }

  async function submitReview() {
    setSubmittingReview(true);
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
      toast({ title: "Review submitted", variant: "success" });
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

  const avgRating =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : experience.avg_rating;

  return (
    <div className="space-y-8">
      {loadScript ? <Script src={CHECKOUT_SRC} strategy="afterInteractive" /> : null}
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{experience.company}</h1>
            <p className="text-lg text-muted-foreground">{experience.role}</p>
            {experience.level ? <p className="text-sm text-muted-foreground">{experience.level}</p> : null}
          </div>
          <Badge className="text-base px-3 py-1">₹{experience.price_inr.toLocaleString("en-IN")}</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {experience.difficulty ? (
            <Badge variant="outline">{VAULT_DIFFICULTY_LABELS[experience.difficulty]}</Badge>
          ) : null}
          {experience.rounds != null ? <Badge variant="outline">{experience.rounds} rounds</Badge> : null}
          {experience.result ? <Badge variant="outline">{VAULT_RESULT_LABELS[experience.result]}</Badge> : null}
          {experience.interview_date ? (
            <Badge variant="outline">{new Date(experience.interview_date).toLocaleDateString()}</Badge>
          ) : null}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            Preview
            {!unlocked ? <Lock className={iconClass("inline", "text-muted-foreground")} /> : <Unlock className={iconClass("inline", "text-positive")} />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{preview}</p>

          {unlocked ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none border-t pt-4"
              dangerouslySetInnerHTML={{ __html: fullContent }}
            />
          ) : (
            <div className="relative overflow-hidden rounded-lg border bg-muted/30 p-6">
              <p className="text-sm leading-relaxed text-muted-foreground blur-sm select-none" aria-hidden>
                {preview}
              </p>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-t from-background via-background/90 to-transparent">
                <Lock className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Premium content locked</p>
                {!isOwner ? (
                  <>
                    <Button onClick={() => void handleUnlock()} disabled={purchasing}>
                      {purchasing ? "Processing…" : `Unlock for ₹${experience.price_inr.toLocaleString("en-IN")}`}
                    </Button>
                    <p className="max-w-xs text-center text-xs text-muted-foreground">
                      Refunds follow the{" "}
                      <Link href={REFUND_TERMS_HREF} className="underline underline-offset-2 hover:text-foreground">
                        Terms payments section
                      </Link>
                      .
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">You own this listing</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <section aria-labelledby="reviews-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="reviews-heading" className="text-lg font-semibold">
            Reviews & ratings
          </h2>
          {avgRating != null ? (
            <span className="flex items-center gap-1 text-sm">
              <Star className={iconClass("inline", "fill-caution text-caution")} />
              {avgRating.toFixed(1)} ({reviews.length})
            </span>
          ) : null}
        </div>

        {unlocked && !isOwner ? (
          <Card>
            <CardContent className="space-y-3 p-4">
              <Label>Your rating</Label>
              <StarRating value={rating} onChange={setRating} />
              <Textarea
                placeholder="Share what was helpful…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
              <Button type="button" onClick={() => void submitReview()} disabled={submittingReview}>
                Submit review
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {reviews.length > 0 ? (
          <ul className="space-y-3">
            {reviews.map((review) => (
              <li key={review.id}>
                <Card>
                  <CardContent className="p-4">
                    <StarRating value={review.rating} />
                    {review.comment ? <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p> : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        )}
      </section>

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
