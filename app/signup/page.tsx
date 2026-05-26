"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Lock, Mail, Sparkles } from "lucide-react";
import { AuthSplitShell } from "../../components/auth/AuthSplitShell";
import { describeAuthError, humanizeSupabaseAuthMessage } from "../../lib/auth-errors";
import { hardNavigate, waitForSignedIn } from "../../lib/client-auth";
import { createBrowserSupabaseClient } from "../../lib/supabase";

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
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Sign up</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
            Enter your email and password to create your WorkGraph account.
          </p>
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <label htmlFor="signup-email" className="sr-only">
              Email
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-3 text-[15px] text-slate-900 outline-none ring-emerald-950/[0.04] transition placeholder:text-slate-400 focus:border-emerald-800 focus:ring-4 focus:ring-emerald-900/12"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="signup-password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password (min 8 chars)"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-3 text-[15px] text-slate-900 outline-none ring-emerald-950/[0.04] transition placeholder:text-slate-400 focus:border-emerald-800 focus:ring-4 focus:ring-emerald-900/12"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-confirm-password" className="sr-only">
              Confirm password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="signup-confirm-password"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm password"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-3 text-[15px] text-slate-900 outline-none ring-emerald-950/[0.04] transition placeholder:text-slate-400 focus:border-emerald-800 focus:ring-4 focus:ring-emerald-900/12"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-900 text-[15px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.08)_inset] transition hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
            {!isSubmitting ? <Sparkles className="h-4 w-4" aria-hidden /> : null}
          </button>
        </form>

        {message ? (
          <div className="space-y-3 rounded-xl border border-emerald-200/90 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-900">
            <p>{message}</p>
            <p className="text-xs leading-relaxed text-emerald-900/90">
              After you confirm your email, sign in with the same password to upload your resume.
            </p>
            <Link
              href="/login?next=/create-profile"
              className="inline-flex w-full items-center justify-center rounded-full border border-emerald-800/30 bg-white py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50"
            >
              Go to sign in
            </Link>
          </div>
        ) : null}
        {error ? (
          <p className="rounded-xl border border-red-200/90 bg-red-50 px-4 py-3 text-center text-sm text-red-900">{error}</p>
        ) : null}

        <p className="text-center text-[14px] text-slate-600">
          Already have an account?{" "}
          <Link
            href="/login?next=/create-profile"
            className="font-semibold text-emerald-900 underline decoration-emerald-200 underline-offset-[5px] hover:text-emerald-950 hover:decoration-emerald-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthSplitShell>
  );
}
