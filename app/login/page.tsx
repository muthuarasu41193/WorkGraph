"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
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
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile`,
        },
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      setMessage("Magic link sent. Check your email to continue.");
    } catch {
      setError("Unable to send magic link right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8fafc] px-6 py-10 text-gray-900">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 10%, rgba(59,130,246,0.08), transparent 36%), radial-gradient(circle at 86% 8%, rgba(15,23,42,0.08), transparent 30%)",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <section>
          <p className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-3 py-1 text-xs font-medium text-[#334155] shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
            Trusted sign-in
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-[#0f172a] sm:text-4xl">
            Build a profile that gets shortlisted faster
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#475569] sm:text-base">
            Sign in with your email to import your resume, refine your profile, and receive ATS-focused feedback.
          </p>

          <div className="mt-6 space-y-3 text-sm text-[#334155]">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
              Passwordless magic-link authentication
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
              Edit links, skills, education, and experience anytime
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
              Professional, recruiter-friendly profile format
            </p>
          </div>
        </section>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_8px_30px_rgb(15_23_42/8%)]">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-[#0f172a]">Sign in to WorkGraph</h2>
            <p className="mt-1 text-sm text-[#64748b]">Enter your email and we will send a secure magic link.</p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[#334155]">Email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-[#94A3B8] focus:border-[#111827] focus:ring-4 focus:ring-[#111827]/5"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Sending..." : "Send Magic Link"}
            </button>
          </form>

          {message ? <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <p className="mt-6 text-sm text-[#64748b]">
            Continue to{" "}
            <Link href="/create-profile" className="font-medium text-[#0f172a] underline underline-offset-4">
              create profile
            </Link>
            {" "}after signing in.
          </p>
        </div>
      </div>
    </main>
  );
}
