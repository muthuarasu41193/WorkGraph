"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  COMPANY_EMAIL_PRIVACY_NOTE,
  COMPANY_EMAIL_WHAT_IT_PROVES,
  type CompanyEmailPublicStatus,
} from "@/lib/vault-company-email";

type Step =
  | "loading"
  | "enter_email"
  | "enter_code"
  | "success"
  | "expired"
  | "too_many_attempts"
  | "send_failure"
  | "active";

type Props = {
  initialStatus?: CompanyEmailPublicStatus | null;
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(ms));
}

export default function VaultCompanyEmailConfirm({ initialStatus = null }: Props) {
  const emailId = useId();
  const codeId = useId();
  const statusId = useId();
  const announceRef = useRef<HTMLParagraphElement>(null);

  const [step, setStep] = useState<Step>(initialStatus ? "loading" : "loading");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<CompanyEmailPublicStatus | null>(initialStatus);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function announce(text: string) {
    setMessage(text);
    if (announceRef.current) {
      announceRef.current.textContent = text;
    }
  }

  function applyStatus(next: CompanyEmailPublicStatus) {
    setStatus(next);
    if (next.claim_active) {
      setStep("active");
      return;
    }
    if (next.pending_challenge) {
      setStep("enter_code");
      return;
    }
    setStep("enter_email");
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/vault/company-email", { method: "GET" });
        const data = (await res.json()) as CompanyEmailPublicStatus & { ok?: boolean; error?: string };
        if (cancelled) return;
        if (!res.ok || data.ok === false) {
          setStep("enter_email");
          setError(data.error ?? "Could not load confirmation status.");
          return;
        }
        applyStatus({
          claim_active: Boolean(data.claim_active),
          verified_at: data.verified_at ?? null,
          expires_at: data.expires_at ?? null,
          pending_challenge: Boolean(data.pending_challenge),
          challenge_expires_at: data.challenge_expires_at ?? null,
          attempts_remaining: data.attempts_remaining ?? null,
        });
      } catch {
        if (!cancelled) {
          setStep("enter_email");
          setError("Could not load confirmation status.");
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function postAction(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/vault/company-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as Record<string, unknown>;
      return { res, data };
    } finally {
      setBusy(false);
    }
  }

  async function sendCode() {
    const { res, data } = await postAction({ action: "start", email });
    if (!res.ok || data.ok === false) {
      if (res.status === 502 || data.step === "send_failure") {
        setStep("send_failure");
      }
      const err = typeof data.error === "string" ? data.error : "Could not send confirmation code.";
      setError(err);
      announce(err);
      return;
    }
    setCode("");
    setStep("enter_code");
    const msg =
      typeof data.message === "string"
        ? data.message
        : "We sent a one-time code. Enter it below.";
    announce(msg);
  }

  async function onSendCode(event: FormEvent) {
    event.preventDefault();
    await sendCode();
  }

  async function onConfirmCode(event: FormEvent) {
    event.preventDefault();
    const { res, data } = await postAction({ action: "confirm", email, code });
    const nextStep = typeof data.step === "string" ? data.step : null;

    if (nextStep === "expired") {
      setStep("expired");
      const err = typeof data.error === "string" ? data.error : "That code has expired.";
      setError(err);
      announce(err);
      return;
    }
    if (nextStep === "too_many_attempts") {
      setStep("too_many_attempts");
      const err =
        typeof data.error === "string" ? data.error : "Too many incorrect attempts.";
      setError(err);
      announce(err);
      return;
    }
    if (!res.ok || data.ok === false) {
      const err = typeof data.error === "string" ? data.error : "That code did not match.";
      setError(err);
      announce(err);
      if (typeof data.attempts_remaining === "number") {
        setStatus((prev) =>
          prev
            ? { ...prev, attempts_remaining: data.attempts_remaining as number }
            : prev,
        );
      }
      return;
    }

    setStep("success");
    setStatus({
      claim_active: true,
      verified_at: typeof data.verified_at === "string" ? data.verified_at : null,
      expires_at: typeof data.expires_at === "string" ? data.expires_at : null,
      pending_challenge: false,
      challenge_expires_at: null,
      attempts_remaining: null,
    });
    const msg =
      typeof data.message === "string"
        ? data.message
        : "Current company email confirmed.";
    announce(msg);
  }

  async function onWithdraw() {
    const { res, data } = await postAction({ action: "withdraw" });
    if (!res.ok || data.ok === false) {
      const err = typeof data.error === "string" ? data.error : "Could not withdraw confirmation.";
      setError(err);
      announce(err);
      return;
    }
    setEmail("");
    setCode("");
    setStatus({
      claim_active: false,
      verified_at: null,
      expires_at: null,
      pending_challenge: false,
      challenge_expires_at: null,
      attempts_remaining: null,
    });
    setStep("enter_email");
    const msg =
      typeof data.message === "string"
        ? data.message
        : "Company-email confirmation withdrawn.";
    announce(msg);
  }

  function resetToEmail() {
    setError(null);
    setCode("");
    setStep("enter_email");
  }

  const verifiedLabel = formatDate(status?.verified_at ?? null);
  const expiresLabel = formatDate(status?.expires_at ?? null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Confirm a current work email</CardTitle>
        <p className="text-sm text-muted-foreground">Optional. Improves the evidence label on your guides.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{COMPANY_EMAIL_WHAT_IT_PROVES}</p>
        <p className="text-sm text-muted-foreground">{COMPANY_EMAIL_PRIVACY_NOTE}</p>

        <p
          id={statusId}
          ref={announceRef}
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {message ?? ""}
        </p>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {step === "loading" ? (
          <p className="text-sm text-muted-foreground">Loading confirmation status…</p>
        ) : null}

        {step === "active" || step === "success" ? (
          <div className="space-y-3">
            <p className="text-sm">
              Status: <span className="font-medium">Current company email confirmed</span>
              {verifiedLabel ? ` (confirmed ${verifiedLabel})` : null}
              {expiresLabel ? `. Label expires ${expiresLabel}.` : null}
            </p>
            <p className="text-sm text-muted-foreground">
              Your work email is not stored after confirmation. Buyers never see the address or domain.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => void onWithdraw()} disabled={busy}>
                {busy ? "Withdrawing…" : "Withdraw confirmation"}
              </Button>
              <Button type="button" variant="secondary" onClick={resetToEmail} disabled={busy}>
                Re-confirm with another email
              </Button>
            </div>
          </div>
        ) : null}

        {step === "enter_email" || step === "send_failure" ? (
          <form className="space-y-3" onSubmit={(e) => void onSendCode(e)}>
            <div className="space-y-2">
              <Label htmlFor={emailId}>Work email</Label>
              <Input
                id={emailId}
                name="work_email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                aria-describedby={statusId}
                placeholder="you@company.com"
              />
            </div>
            <Button type="submit" disabled={busy || !email.trim()}>
              {busy ? "Sending code…" : "Send confirmation code"}
            </Button>
            {step === "send_failure" ? (
              <p className="text-sm text-muted-foreground">
                Sending failed. Check that transactional email is configured, then try again.
              </p>
            ) : null}
          </form>
        ) : null}

        {step === "enter_code" ? (
          <form className="space-y-3" onSubmit={(e) => void onConfirmCode(e)}>
            <div className="space-y-2">
              <Label htmlFor={emailId}>Work email</Label>
              <Input
                id={emailId}
                name="work_email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={codeId}>One-time code</Label>
              <Input
                id={codeId}
                name="confirmation_code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={busy}
                aria-describedby={statusId}
              />
            </div>
            {typeof status?.attempts_remaining === "number" ? (
              <p className="text-xs text-muted-foreground">
                Attempts remaining: {status.attempts_remaining}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy || code.length !== 6}>
                {busy ? "Confirming…" : "Confirm code"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy || !email.trim()}
                onClick={() => void sendCode()}
              >
                {busy ? "Sending…" : "Resend code"}
              </Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={resetToEmail}>
                Use a different email
              </Button>
            </div>
          </form>
        ) : null}

        {step === "expired" || step === "too_many_attempts" ? (
          <div className="space-y-3">
            <Button type="button" onClick={resetToEmail} disabled={busy}>
              Request a new code
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
