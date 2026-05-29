"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import { AuthSplitShell } from "../../components/auth/AuthSplitShell";
import { signInWithPassword } from "../../lib/auth/client";
import { supertokensEnabled } from "../../lib/auth/config";
import { describeAuthError, humanizeSupabaseAuthMessage } from "../../lib/auth-errors";
import { hardNavigate } from "../../lib/client-auth";
import { createBrowserSupabaseClient } from "../../lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function humanizeAuthError(raw: string): string {
  return humanizeSupabaseAuthMessage(raw);
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotBusy, setForgotBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const reason = params.get("reason");
    const errQ = params.get("error");
    if (reason === "session") {
      setMessage("Your session expired or you were not signed in. Sign in below to continue.");
    }
    if (errQ) {
      const decoded = decodeURIComponent(errQ);
      if (decoded === "missing_code") {
        setError(
          "That sign-in link was incomplete or expired. Request a new confirmation or password-reset email from Supabase, or sign in with your password."
        );
      } else {
        setError(humanizeAuthError(decoded));
      }
    }
  }, []);

  async function onForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setForgotSent(false);
    setError("");
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email above, then try Forgot password again.");
      return;
    }
    setForgotBusy(true);
    try {
      if (supertokensEnabled()) {
        setError("Password reset for SuperTokens: use the reset flow at /auth or contact your admin.");
        return;
      }
      const supabase = createBrowserSupabaseClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/profile")}`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo });
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setForgotSent(true);
    } catch {
      setError("Could not send reset email. Try again.");
    } finally {
      setForgotBusy(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const params = new URLSearchParams(window.location.search);
      const nextPath =
        typeof params.get("next") === "string" && params.get("next")!.startsWith("/")
          ? params.get("next")!
          : "/profile";

      const result = await signInWithPassword(email, password);
      if (!result.ok) {
        setError(humanizeAuthError(result.error ?? "Sign in failed"));
        return;
      }

      setMessage("Signed in successfully. Redirecting...");
      hardNavigate(nextPath);
    } catch (err) {
      setError(describeAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthSplitShell
      panelEyebrow="Welcome back"
      panelHeadline="Sign in and keep your profile interview-ready."
      panelDescription="Use your WorkGraph email and password."
      highlights={[
        "Secure email + password sign in",
        "Pick up where you left off on any device",
        "Designed for ATS-friendly layouts",
      ]}
    >
      <div className="wg-auth-enter space-y-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Sign in</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Enter your email and password to continue.
          </p>
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="login-email" className="sr-only">
              Email
            </Label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                className="h-12 pl-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password" className="sr-only">
              Password
            </Label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="h-12 pl-11"
              />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-full text-[15px]">
            {isSubmitting ? "Signing in…" : "Continue"}
          </Button>
        </form>

        {message ? (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
            <AlertDescription className="text-center text-emerald-900">{message}</AlertDescription>
          </Alert>
        ) : null}
        {error ? (
          <Alert variant="destructive">
            <AlertDescription className="text-center">{error}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="border-slate-200 bg-muted/30 shadow-none">
          <CardContent className="p-4 text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => {
                setShowForgot((v) => !v);
                setForgotSent(false);
              }}
              className="font-semibold text-primary underline decoration-primary/30 underline-offset-4 hover:text-primary/80"
            >
              {showForgot ? "Hide password reset" : "Forgot password?"}
            </button>
            {showForgot ? (
              <form className="mt-3 space-y-2" onSubmit={onForgotPassword}>
                <p className="text-xs leading-relaxed">
                  Uses the email in the &quot;Email&quot; field. We send a Supabase reset link to that address.
                </p>
                <Button type="submit" variant="outline" disabled={forgotBusy} className="w-full">
                  {forgotBusy ? "Sending…" : "Send reset link"}
                </Button>
                {forgotSent ? (
                  <p className="text-xs text-emerald-700">If an account exists, check your inbox for the reset link.</p>
                ) : null}
              </form>
            ) : null}
          </CardContent>
        </Card>

        <p className="text-center text-[14px] text-muted-foreground">
          New to WorkGraph?{" "}
          <Link href="/signup" className="font-semibold text-primary underline decoration-primary/30 underline-offset-4">
            Sign up
          </Link>
        </p>

        <p className="text-center text-xs leading-relaxed text-muted-foreground/70">
          Keep your password secure and do not share it with anyone.
        </p>
      </div>
    </AuthSplitShell>
  );
}
