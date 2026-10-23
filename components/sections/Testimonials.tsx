"use client";

import { cn } from "@/lib/utils";
import {
  EARLY_STAGE_COPY,
  teamMemberDisclosure,
  type TestimonialRow,
} from "@/lib/social-proof";

function TestimonialCard({ item }: { item: TestimonialRow }) {
  const disclosure = teamMemberDisclosure(item.is_employee);
  const initial = item.author_name.trim().charAt(0).toUpperCase() || "?";

  return (
    <article
      className={cn(
        "group break-inside-avoid rounded-2xl border border-border-default bg-surface p-6 shadow-sm transition-all duration-base hover:border-brand/20 hover:shadow-overlay",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-sm font-bold text-accent-ink"
            aria-hidden
          >
            {initial}
          </div>
          <div>
            <p className="font-semibold text-fg-primary">{item.author_name}</p>
            {item.author_title ? (
              <p className="mt-0.5 text-xs text-fg-tertiary">{item.author_title}</p>
            ) : null}
            {disclosure ? (
              <p className="mt-1 text-xs font-semibold text-brand">{disclosure}</p>
            ) : null}
          </div>
        </div>
      </div>

      {item.verified_outcome ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-success-50 px-2.5 py-1 text-xs font-bold text-success">
            {item.verified_outcome}
          </span>
        </div>
      ) : null}

      <blockquote className="mt-4 text-md leading-relaxed text-fg-secondary">
        &ldquo;{item.quote}&rdquo;
      </blockquote>
    </article>
  );
}

export default function Testimonials({ items }: { items: TestimonialRow[] }) {
  const consented = items.filter((row) => row.consent_given_at);

  return (
    <section aria-label="Testimonials" className="bg-background py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-4 md:px-6 min-[1025px]:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold text-brand text-role-caption">
            From people using WorkGraph
          </p>
          <h2 className="wg-section-heading mt-4 font-heading font-bold tracking-tight text-fg-primary">
            {consented.length > 0
              ? "Stories from people who consented to share"
              : EARLY_STAGE_COPY}
          </h2>
        </header>

        {consented.length > 0 ? (
          <div className="mt-14 columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
            {consented.map((item) => (
              <TestimonialCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="mx-auto mt-10 max-w-xl text-center text-fg-secondary">
            When someone consents to a public quote, it will show up here. We do not publish
            placeholder reviews.
          </p>
        )}
      </div>
    </section>
  );
}
