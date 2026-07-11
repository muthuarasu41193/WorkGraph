"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const WAITLIST_EXPECTATIONS = [
  "Early access to hidden job discovery across 50+ sources",
  "AI match scoring and Interview Vault previews",
  "Priority onboarding when your spot opens up",
] as const;

export default function WaitlistClient() {
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Ready for waitlist API integration
      console.log("[waitlist] signup:", email.trim());
      await new Promise((r) => setTimeout(r, 600));
      window.location.href = "/waitlist?success=true";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F8F7F4] px-4 py-16">
      <div className="w-full max-w-md rounded-[20px] border border-[#E5E5E5] bg-white p-10 shadow-lg">
        <div className="flex justify-center">
          <Logo />
        </div>

        {isSuccess ? (
          <div className="mt-8 text-center">
            <CheckCircle2 className="mx-auto size-14 text-[#16A34A]" aria-hidden />
            <h1 className="mt-4 font-heading text-2xl font-bold text-[#0A0A0A]">
              You&apos;re on the list!
            </h1>
            <p className="mt-3 text-[#4A4A4A]">
              We&apos;ll email you when your spot opens. Check your inbox for a confirmation.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block text-sm font-semibold text-[#C41E3A] hover:text-[#A01830]"
            >
              ← Back to home
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mt-8 text-center font-heading text-2xl font-bold text-[#0A0A0A]">
              Join the waitlist
            </h1>
            <p className="mt-2 text-center text-sm text-[#8A8A8A]">
              247 people ahead of you
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div>
                <Label htmlFor="waitlist-email" className="mb-2 block text-[#0A0A0A]">
                  Email address
                </Label>
                <Input
                  id="waitlist-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg"
                />
              </div>

              {error && (
                <p className="text-sm text-[#C41E3A]" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#C41E3A] py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#A01830] disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" aria-hidden />
                    Joining...
                  </>
                ) : (
                  "Join waitlist →"
                )}
              </button>
            </form>

            <div className="mt-8 border-t border-[#E5E5E5] pt-6">
              <p className="text-sm font-semibold text-[#0A0A0A]">What to expect while waiting</p>
              <ul className="mt-3 space-y-2" role="list">
                {WAITLIST_EXPECTATIONS.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-[#4A4A4A]">
                    <span className="text-[#C41E3A]" aria-hidden>
                      •
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
