"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Lock, Mail, Sparkles } from "lucide-react";
import { AuthSplitShell } from "../../components/auth/AuthSplitShell";
import { describeAuthError, humanizeSupabaseAuthMessage } from "../../lib/auth-errors";
import { signUpWithPassword } from "../../lib/auth/client";
import { supertokensEnabled } from "../../lib/auth/config";
import { hardNavigate, syncServerAuthCookies, waitForSignedIn } from "../../lib/client-auth";
import { createBrowserSupabaseClient } from "../../lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function humanizeAuthError(raw: string): string {
    return humanizeSupabaseAuthMessage(raw);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      if (supertokensEnabled()) {
        const result = await signUpWithPassword(email, password);
        if (!result.ok) {
          setError(humanizeAuthError(result.error ?? "Sign up failed"));
          return;
        }
        setMessage("Account created. Redirecting to profile setup…");
        hardNavigate("/create-profile");
        return;
      }

      const supabase = createBrowserSupabaseClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/create-profile")}`,
        },
      });

      if (signUpError) {
        setError(humanizeAuthError(signUpError.message));
        return;
      }

      if (data.session) {
        const ready = await waitForSignedIn();
        if (ready) {
          await syncServerAuthCookies();
          hardNavigate("/create-profile");
          return;
        }
        setError("Account created, but the session did not sync. Please sign in.");
        return;
      }

      setMessage(
        "Account created. Before you can sign in, Supabase may require you to confirm your email — open the message we sent (check spam), then use Sign in below."
      );
    } catch (err) {
      setError(describeAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthSplitShell
      panelEyebrow="Create account"
      panelHeadline="Upload your resume and launch your profile in minutes."
      panelDescription="Create your account with email and password, then start building your profile."
      highlights={[
        "Secure email + password account",
        "Auto profile generation from resume",
        "Get redirected straight into profile setup",
      ]}
    >
      <div className="wg-auth-enter space-y-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Sign up</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Enter your email and password to create your WorkGraph account.
          </p>
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="signup-email" className="sr-only">
              Email
            </Label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="signup-email"
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
            <Label htmlFor="signup-password" className="sr-only">
              Password
            </Label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="signup-password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password (min 8 chars)"
                className="h-12 pl-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-confirm-password" className="sr-only">
              Confirm password
            </Label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="signup-confirm-password"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm password"
                className="h-12 pl-11"
              />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-full text-[15px]">
            {isSubmitting ? "Creating account…" : "Create account"}
            {!isSubmitting ? <Sparkles className="h-4 w-4" aria-hidden /> : null}
          </Button>
        </form>

        {message ? (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
            <AlertDescription className="space-y-3 text-center">
              <p>{message}</p>
              <p className="text-xs leading-relaxed text-emerald-900/90">
                After you confirm your email, sign in with the same password to upload your resume.
              </p>
              <Button asChild variant="outline" className="w-full rounded-full border-emerald-300 bg-white text-emerald-950 hover:bg-emerald-50">
                <Link href="/login?next=/create-profile">Go to sign in</Link>
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
        {error ? (
          <Alert variant="destructive">
            <AlertDescription className="text-center">{error}</AlertDescription>
          </Alert>
        ) : null}

        <p className="text-center text-[14px] text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login?next=/create-profile" className="font-semibold text-primary underline decoration-primary/30 underline-offset-4">
            Sign in
          </Link>
        </p>

        <p className="text-center text-[14px] text-muted-foreground">
          Hiring talent?{" "}
          <Link href="/employer/signup" className="font-semibold text-primary underline decoration-primary/30 underline-offset-4">
            Employer signup
          </Link>
        </p>
      </div>
    </AuthSplitShell>
  );
}
