"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import { AuthSplitShell } from "@/components/auth/AuthSplitShell";
import { describeAuthError, humanizeSupabaseAuthMessage } from "@/lib/auth-errors";
import { hardNavigate, syncServerAuthCookies, waitForSignedIn } from "@/lib/client-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EmployerSignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      const supabase = createBrowserSupabaseClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/employer/onboarding")}`,
        },
      });
      if (signUpError) {
        setError(humanizeSupabaseAuthMessage(signUpError.message));
        return;
      }
      if (data.session) {
        const ready = await waitForSignedIn();
        if (ready) {
          await syncServerAuthCookies();
          hardNavigate("/employer/onboarding");
          return;
        }
      }
      hardNavigate("/employer/onboarding");
    } catch (err) {
      setError(describeAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthSplitShell
      panelEyebrow="Employer"
      panelHeadline="Post hiring signals on WorkGraph Direct"
      panelDescription="Not another job board — intent posts with fit criteria and profile-based connections."
      highlights={[
        "Why now — explain what changed, not boilerplate JDs",
        "Fit signals weighted against seeker profiles",
        "Pulse inbox with dialogue stages",
      ]}
    >
      <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-4">
        <h2 className="text-heading-m">Create employer account</h2>
        <p className="text-body text-muted-foreground">
          Jobseeker?{" "}
          <Link href="/signup" className="text-[var(--accent)] underline-offset-2 hover:underline">
            Sign up as a seeker
          </Link>
        </p>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              className="pl-9"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Continue"}
        </Button>
        <p className="text-center text-body text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login?next=/employer/onboarding" className="font-medium text-foreground">
            Sign in
          </Link>
        </p>
      </form>
    </AuthSplitShell>
  );
}
