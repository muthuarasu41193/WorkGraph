"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";
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
    <main className="min-h-screen bg-[#FAFAFA] px-6 py-10 text-gray-900">
      <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure sign-in
          </p>
          <h1 className="mt-3 text-2xl font-semibold">Sign in to WorkGraph</h1>
          <p className="mt-1 text-sm text-gray-600">
            Use your email to receive a magic link. No password required.
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Email</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-0 transition placeholder:text-gray-400 focus:border-gray-400"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Sending..." : "Send Magic Link"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}

        <p className="mt-6 text-sm text-gray-500">
          Back to{" "}
          <Link href="/profile" className="text-gray-800 underline underline-offset-4 hover:text-black">
            profile
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
