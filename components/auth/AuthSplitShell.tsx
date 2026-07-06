"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { WorkGraphLogo } from "@/components/brand/WorkGraphLogo";

type AuthSplitShellProps = {
  panelEyebrow?: string;
  panelHeadline: string;
  panelDescription?: string;
  highlights?: readonly string[];
  children: ReactNode;
  wide?: boolean;
};

export function AuthSplitShell({
  panelEyebrow,
  panelHeadline,
  panelDescription,
  highlights,
  children,
  wide,
}: AuthSplitShellProps) {
  return (
    <main className="flex min-h-[100dvh] flex-col bg-background antialiased lg:flex-row">
      <header className="wg-auth-panel relative shrink-0 border-b px-6 py-8 lg:hidden">
        <div className="pointer-events-none absolute inset-0 wg-auth-grid opacity-[0.35]" aria-hidden />
        <div className="relative flex items-center gap-3">
          <Link href="/" className="outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <WorkGraphLogo />
          </Link>
        </div>
        <p className="relative mt-4 text-body font-medium text-foreground">{panelHeadline}</p>
      </header>

      <aside className="wg-auth-panel relative hidden min-h-[100dvh] flex-[1.05] border-r lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-16 xl:px-16">
        <div className="pointer-events-none absolute inset-0 wg-auth-grid opacity-[0.35]" aria-hidden />
        <div className="relative">
          <Link
            href="/"
            className="inline-flex rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <WorkGraphLogo />
          </Link>

          <div className="mt-16 max-w-lg space-y-5 xl:mt-20">
            {panelEyebrow ? <p className="wg-label-mono">{panelEyebrow}</p> : null}
            <h1 className="text-pretty text-heading-xl leading-[1.15] text-foreground xl:text-[2.125rem]">
              {panelHeadline}
            </h1>
            {panelDescription ? (
              <p className="text-pretty text-body-lg text-muted-foreground">{panelDescription}</p>
            ) : null}
            {highlights && highlights.length > 0 ? (
              <ul className="space-y-3 pt-2">
                {highlights.map((item) => (
                  <li key={item} className="flex gap-3 text-body leading-snug text-muted-foreground">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <p className="relative mt-12 max-w-md text-caption leading-relaxed text-muted-foreground lg:mt-0">
          Profiles tuned for recruiters and ATS scans — refine anytime after sign-in.
        </p>
      </aside>

      <section
        className={`flex min-h-0 flex-1 flex-col bg-card px-5 pb-12 pt-8 sm:px-10 lg:max-h-[100dvh] lg:overflow-y-auto lg:px-16 lg:pb-16 xl:px-20 ${wide ? "justify-start lg:pt-16 xl:pt-16" : "justify-center lg:pt-16"}`}
      >
        <div className={`wg-auth-enter mx-auto w-full ${wide ? "max-w-xl" : "max-w-[400px]"}`}>{children}</div>
      </section>
    </main>
  );
}
