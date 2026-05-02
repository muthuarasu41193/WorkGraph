"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type AuthSplitShellProps = {
  panelEyebrow?: string;
  panelHeadline: string;
  panelDescription?: string;
  /** Highlights shown under description (desktop left panel). */
  highlights?: readonly string[];
  children: ReactNode;
  /** Use wider column for forms with many fields */
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
    <main className="flex min-h-[100dvh] flex-col bg-white antialiased lg:flex-row">
      {/* Mobile / tablet: animated brand strip */}
      <header className="relative shrink-0 overflow-hidden bg-gradient-to-br from-emerald-950 via-green-950 to-teal-950 px-6 py-8 lg:hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,rgba(255,255,255,0.06)_0%,transparent_42%,rgba(16,185,129,0.08)_100%)]"
        />
        <div className="pointer-events-none absolute inset-0 opacity-95">
          <div className="wg-auth-blob wg-auth-blob-a absolute -left-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-emerald-400/28 blur-3xl" />
          <div className="wg-auth-blob wg-auth-blob-b absolute -right-10 top-0 h-44 w-44 rounded-full bg-teal-400/22 blur-3xl" />
        </div>
        <div className="relative flex items-center gap-3">
          <BrandMark />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400/85">
              WorkGraph
            </p>
            <p className="truncate text-sm font-medium text-white">{panelHeadline}</p>
          </div>
        </div>
      </header>

      {/* Desktop left panel */}
      <aside className="relative hidden min-h-[100dvh] flex-[1.05] overflow-hidden bg-gradient-to-br from-emerald-950 via-green-950 to-teal-950 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-14 xl:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(155deg,rgba(255,255,255,0.055)_0%,transparent_38%,rgba(20,184,166,0.09)_68%,transparent_100%)]"
        />
        <div className="pointer-events-none absolute inset-0">
          <div className="wg-auth-grid-green absolute inset-0 opacity-[0.085]" aria-hidden />
          <div className="wg-auth-blob wg-auth-blob-a absolute -left-10 top-[18%] h-[380px] w-[380px] rounded-full bg-emerald-400/26 blur-[100px]" />
          <div className="wg-auth-blob wg-auth-blob-b absolute bottom-[12%] right-[-8%] h-[340px] w-[340px] rounded-full bg-teal-400/20 blur-[90px]" />
          <div className="wg-auth-blob wg-auth-blob-c absolute left-[35%] top-[42%] h-[220px] w-[220px] rounded-full bg-green-500/18 blur-[72px]" />
        </div>

        <div className="relative">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-xl outline-none ring-offset-2 ring-offset-emerald-950 focus-visible:ring-2 focus-visible:ring-emerald-300/70"
          >
            <BrandMark />
            <span className="text-lg font-semibold tracking-tight text-white">WorkGraph</span>
          </Link>

          <div className="mt-14 max-w-lg space-y-5 xl:mt-20">
            {panelEyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/85">{panelEyebrow}</p>
            ) : null}
            <h1 className="text-pretty text-3xl font-semibold leading-[1.15] tracking-tight text-white xl:text-[2.125rem]">
              {panelHeadline}
            </h1>
            {panelDescription ? (
              <p className="text-pretty text-base leading-relaxed text-emerald-100/88">{panelDescription}</p>
            ) : null}
            {highlights && highlights.length > 0 ? (
              <ul className="space-y-3 pt-2">
                {highlights.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-snug text-emerald-50/82">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300/95 shadow-[0_0_14px_rgba(94,234,212,0.45)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <p className="relative mt-12 max-w-md text-xs leading-relaxed text-emerald-200/45 lg:mt-0">
          Profiles tuned for recruiters and ATS scans — refine anytime after sign-in.
        </p>
      </aside>

      {/* Form column — wide layouts scroll from top; narrow login stays vertically centered */}
      <section
        className={`flex min-h-0 flex-1 flex-col bg-white px-5 pb-12 pt-8 sm:px-10 lg:max-h-[100dvh] lg:overflow-y-auto lg:px-14 lg:pb-14 xl:px-20 ${wide ? "justify-start lg:pt-14 xl:pt-16" : "justify-center lg:pt-14"}`}
      >
        <div className={`mx-auto w-full ${wide ? "max-w-xl" : "max-w-[400px]"}`}>{children}</div>
      </section>
    </main>
  );
}

function BrandMark() {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white/[0.14] to-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ring-1 ring-white/12">
      <span className="h-5 w-5 rounded-md bg-gradient-to-br from-emerald-300 via-teal-400 to-green-700 opacity-[0.97] shadow-[0_10px_32px_rgba(16,185,129,0.42)]" />
    </span>
  );
}
