"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { SocialLinks } from "@/components/brand/SocialLinks";
import { FOOTER_LINKS, SITE } from "@/lib/constants";
import { CookiePreferencesButton } from "@/components/consent/CookiePreferencesButton";
import { LEGAL_NAV } from "@/lib/legal";
import { displayCount } from "@/lib/social-proof";

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center text-sm text-fg-tertiary transition-all duration-200 hover:translate-x-1 hover:text-brand"
    >
      {children}
    </Link>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-3" role="list">
        {links.map((link) => (
          <li key={link.label}>
            <FooterLink href={link.href}>{link.label}</FooterLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NewsletterStrip({ signups }: { signups: number }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const subscribers = displayCount(signups);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // Ready for newsletter service integration
    console.log("[newsletter] Subscribe:", email.trim());
    setSubmitted(true);
    setEmail("");
  };

  return (
    <div className="bg-brand px-4 py-10 md:px-6 min-[1025px]:px-8">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-heading text-xl font-bold text-white sm:text-2xl">
            Stay ahead. Get the weekly hidden jobs digest.
          </p>
          <p className="mt-2 text-sm text-white/80">
            No spam. Unsubscribe anytime.{" "}
            {subscribers.showNumber
              ? `${subscribers.display} people have signed up`
              : subscribers.display}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            aria-label="Email address"
            className="flex-1 rounded-lg border-0 bg-surface/95 px-4 py-3 text-sm text-fg-primary outline-none placeholder:text-fg-tertiary focus:ring-2 focus:ring-white/50"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-surface px-6 py-3 text-sm font-semibold text-brand transition-all duration-200 hover:scale-[1.02] hover:bg-brand-50"
          >
            {submitted ? "Subscribed!" : "Subscribe"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Footer({ signups = 0 }: { signups?: number }) {
  return (
    <footer aria-label="Site footer">
      <NewsletterStrip signups={signups} />

      <div className="bg-slate-950 px-4 py-14 md:px-6 min-[1025px]:px-8">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Logo className="[&_span]:text-white [&_svg_path:first-child]:fill-white" />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-fg-tertiary">
                Find jobs that never hit LinkedIn.
              </p>
              <SocialLinks className="mt-6" />
              <p className="mt-6 text-sm text-fg-tertiary">Made with ❤️ for job seekers</p>
            </div>

            <FooterColumn title="Product" links={FOOTER_LINKS.product} />
            <FooterColumn title="Resources" links={FOOTER_LINKS.resources} />
            <FooterColumn title="Company" links={FOOTER_LINKS.company} />
          </div>

          <div className="mt-12 border-t border-slate-800 pt-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-fg-tertiary">
                &copy; 2025 {SITE.name}. All rights reserved.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-fg-tertiary">
                {LEGAL_NAV.map((item, index) => (
                  <span key={item.href} className="inline-flex items-center gap-4">
                    {index > 0 ? <span aria-hidden>·</span> : null}
                    <FooterLink href={item.href}>{item.label}</FooterLink>
                  </span>
                ))}
                <span className="inline-flex items-center gap-4">
                  <span aria-hidden>·</span>
                  <CookiePreferencesButton className="hover:translate-x-1 hover:no-underline" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
