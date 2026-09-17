/* LEGAL REVIEW REQUIRED — DO NOT SHIP WITHOUT COUNSEL SIGN-OFF. */

import Link from "next/link";
import type { ReactNode } from "react";
import { CookiePreferencesButton } from "@/components/consent/CookiePreferencesButton";
import { LEGAL_NAV, tocFromSections, type LegalHeading } from "@/lib/legal";
import { cn } from "@/lib/utils";

export type LegalSection = LegalHeading & { content: ReactNode };

export function LegalNav({ className }: { className?: string }) {
  return (
    <nav aria-label="Legal documents" className={className}>
      <ul className="flex flex-wrap gap-x-4 gap-y-2">
        {LEGAL_NAV.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-sm text-fg-tertiary underline-offset-4 transition-colors hover:text-brand hover:underline"
            >
              {item.label}
            </Link>
          </li>
        ))}
        <li>
          <CookiePreferencesButton />
        </li>
      </ul>
    </nav>
  );
}

export function LegalTable({
  headers,
  rows,
}: {
  headers: readonly string[];
  rows: readonly (readonly string[])[];
}) {
  return (
    <div className="my-6 overflow-x-auto rounded-xl border border-border-default">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="bg-surface-2 text-fg-secondary">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="px-3 py-2.5 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-t border-border-default align-top">
              {row.map((cell, index) => (
                <td
                  key={`${row[0]}-${index}`}
                  className={cn("px-3 py-2.5 text-fg-secondary", index === 0 && "font-medium text-fg-primary")}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LegalDocument({
  title,
  version,
  lastUpdated,
  intro,
  sections,
}: {
  title: string;
  version: string;
  lastUpdated: string;
  intro?: ReactNode;
  sections: LegalSection[];
}) {
  const toc = tocFromSections(sections);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <p className="rounded-lg border border-warning-50 bg-warning-50 px-3 py-2 text-sm font-semibold text-warning">
        Draft for counsel review. Do not treat this as an in-force legal document.
      </p>
      <header className="mt-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Legal</p>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-fg-primary sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-fg-tertiary">
          Version {version}
          <span aria-hidden> · </span>
          Last updated {lastUpdated}
        </p>
      </header>

      {intro ? <div className="mt-6 space-y-4 text-fg-secondary leading-relaxed">{intro}</div> : null}

      <nav
        aria-label="Table of contents"
        className="mt-10 rounded-2xl border border-border-default bg-surface p-5"
      >
        <p className="text-sm font-semibold text-fg-primary">Contents</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
          {toc.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="text-brand underline-offset-4 hover:underline">
                {item.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12 space-y-12">
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={section.id}>
            <h2
              id={section.id}
              className="scroll-mt-24 font-heading text-xl font-bold tracking-tight text-fg-primary sm:text-2xl"
            >
              <a href={`#${section.id}`} className="hover:text-brand">
                {section.title}
              </a>
            </h2>
            <div className="mt-4 space-y-4 text-fg-secondary leading-relaxed">{section.content}</div>
          </section>
        ))}
      </div>
    </article>
  );
}
