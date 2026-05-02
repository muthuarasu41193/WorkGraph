"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthSplitShell } from "../../components/auth/AuthSplitShell";
import { createBrowserSupabaseClient } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const params = new URLSearchParams(window.location.search);
      const nextParam = params.get("next");
      const nextPath =
        typeof nextParam === "string" && nextParam.startsWith("/") ? nextParam : "/profile";
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      setMessage("Check your inbox — we sent a sign-in link.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthSplitShell
      panelEyebrow="Welcome back"
      panelHeadline="Sign in and keep your profile interview-ready."
      panelDescription="Passwordless email — fast for you, familiar for recruiters."
      highlights={[
        "Magic link — no password to forget",
        "Pick up where you left off on any device",
        "Designed for ATS-friendly layouts",
      ]}
    >
      <div className="wg-auth-enter space-y-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
            Enter your work email and we&apos;ll send you a secure link.
          </p>
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <label htmlFor="login-email" className="sr-only">
              Email
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="login-email"
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center rounded-full bg-emerald-900 text-[15px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.08)_inset] transition hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isSubmitting ? "Sending link…" : "Continue"}
          </button>
        </form>

        {message ? (
          <p className="rounded-xl border border-emerald-200/90 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-900">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl border border-red-200/90 bg-red-50 px-4 py-3 text-center text-sm text-red-900">{error}</p>
        ) : null}

        <p className="text-center text-[14px] text-slate-600">
          New to WorkGraph?{" "}
          <Link
            href="/create-profile"
            className="font-semibold text-emerald-900 underline decoration-emerald-200 underline-offset-[5px] hover:text-emerald-950 hover:decoration-emerald-700"
          >
            Create your profile
          </Link>
        </p>

        <p className="text-center text-xs leading-relaxed text-slate-400">
          By continuing you agree to receive a one-time sign-in email from WorkGraph.
        </p>
      </div>
    </AuthSplitShell>
  );
}
