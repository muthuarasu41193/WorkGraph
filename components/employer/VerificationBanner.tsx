"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Loader2, Shield } from "lucide-react";
import type { EmployerProfile } from "@/lib/employer/types";
import { VERIFICATION_STATUS_LABELS } from "@/lib/employer/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type Props = {
  profile: EmployerProfile;
  onUpdated?: (profile: EmployerProfile) => void;
};

export default function VerificationBanner({ profile, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [local, setLocal] = useState(profile);

  async function requestVerify() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/employer/verify", { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; profile?: EmployerProfile; error?: string };
      if (!res.ok || !data.ok || !data.profile) {
        setError(data.error ?? "Verification request failed");
        return;
      }
      setLocal(data.profile);
      onUpdated?.(data.profile);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (local.verification_status === "verified") {
    return (
      <Alert className="border-success/20 bg-success-subtle/80 dark:bg-success-subtle/30">
        <BadgeCheck className="h-4 w-4 text-success-foreground" />
        <AlertTitle className="text-success-foreground dark:text-success-foreground">
          {VERIFICATION_STATUS_LABELS.verified}
        </AlertTitle>
        <AlertDescription className="text-success-foreground dark:text-success-foreground">
          Your public company page is live at{" "}
          <Link
            href={`/company/${local.company_slug}`}
            className="font-medium underline underline-offset-2"
          >
            /company/{local.company_slug}
          </Link>
          . Verified signals are discoverable to all jobseekers.
        </AlertDescription>
      </Alert>
    );
  }

  if (local.verification_status === "rejected") {
    return (
      <Alert variant="destructive">
        <AlertTitle>{VERIFICATION_STATUS_LABELS.rejected}</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>Update your website or use a matching work email, then request verification again.</p>
          <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => void requestVerify()}>
            Retry verification
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (local.verification_status === "pending") {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>{VERIFICATION_STATUS_LABELS.pending}</AlertTitle>
        <AlertDescription>
          We are reviewing your employer profile. You can still post signals; your public company page
          activates once verified.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-[var(--accent)]/20 bg-[var(--accent)]/[0.04]">
      <Shield className="h-4 w-4 text-[var(--accent)]" />
      <AlertTitle>Verify your company</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Verified employers get a public page at{" "}
          <code className="text-xs">/company/{local.company_slug}</code> and stronger trust on WorkGraph
          Direct. We match your work email domain to your website when possible.
        </p>
        {!local.website_url ? (
          <p className="text-xs text-muted-foreground">
            Tip: add <strong>website_url</strong> in onboarding or profile settings first.
          </p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="button" size="sm" disabled={loading} onClick={() => void requestVerify()}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Request verification
        </Button>
      </AlertDescription>
    </Alert>
  );
}
