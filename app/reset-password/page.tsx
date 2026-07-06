"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { AuthSplitShell } from "@/components/auth/AuthSplitShell";
import { updatePassword } from "@/lib/auth/client";
import { humanizeSupabaseAuthMessage } from "@/lib/auth-errors";
import { hardNavigate, syncServerAuthCookies } from "@/lib/client-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    async function ensureRecoverySession() {
      // Hash tokens from some Supabase email templates (implicit recovery flow)
      const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
      if (hash.includes("type=recovery")) {
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          window.history.replaceState(null, "", window.location.pathname);
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        setReady(true);
        setChecking(false);
        return;
      }

      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed.session?.access_token) {
        setReady(true);
        setChecking(false);
        return;
      }

      setChecking(false);
      setError("This reset link is invalid or expired. Request a new one from the login page.");
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
        setChecking(false);
      }
    });

    void ensureRecoverySession();

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await updatePassword(password);
      if (!result.ok) {
        setError(humanizeSupabaseAuthMessage(result.error ?? "Could not update password."));
        return;
      }
      await syncServerAuthCookies();
      setMessage("Password updated. Redirecting to your profile…");
      hardNavigate("/profile?password_updated=1");
    } catch {
      setError("Could not update password. Try again or request a new reset link.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthSplitShell
      panelEyebrow="Account security"
      panelHeadline="Choose a new password"
      panelDescription="Your reset link is valid for a short time. Set a new password to sign in later."
      highlights={[
        "Password is saved to your WorkGraph account",
        "Use at least 8 characters",
        "You will stay signed in after saving",
      ]}
    >
      <div className="wg-auth-enter space-y-8">
        <div>
          <h2 className="text-heading-l text-foreground">Reset password</h2>
          <p className="mt-2 text-body text-muted-foreground">
            Enter and confirm your new password below.
          </p>
        </div>

        {checking ? (
          <p className="text-body text-muted-foreground">Verifying your reset link…</p>
        ) : !ready ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error || "Reset link invalid or expired."}</AlertDescription>
            </Alert>
            <Button asChild className="w-full">
              <Link href="/login">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="new-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  size="lg"
                  className="pl-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  size="lg"
                  className="pl-12"
                />
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="h-12 w-full rounded-full text-body">
              {submitting ? "Saving…" : "Save new password"}
            </Button>
          </form>
        )}

        {message ? (
          <Alert className="border-success/20 bg-success-subtle text-success-foreground">
            <AlertDescription className="text-center text-success-foreground">{message}</AlertDescription>
          </Alert>
        ) : null}
        {ready && error ? (
          <Alert variant="destructive">
            <AlertDescription className="text-center">{error}</AlertDescription>
          </Alert>
        ) : null}

        <p className="text-center text-body text-muted-foreground">
          <Link href="/login" className="font-semibold text-primary underline decoration-primary/30 underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthSplitShell>
  );
}
