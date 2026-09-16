"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { CompanyLogoStrip } from "@/components/brand/CompanyLogoStrip";
import { cn } from "@/lib/utils";
import {
  EARLY_STAGE_COPY,
  teamMemberDisclosure,
  type TestimonialRow,
} from "@/lib/social-proof";

function TestimonialCard({ item, index }: { item: TestimonialRow; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const prefersReducedMotion = useReducedMotion();
  const disclosure = teamMemberDisclosure(item.is_employee);
  const initial = item.author_name.trim().charAt(0).toUpperCase() || "?";

  return (
    <motion.article
      ref={ref}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group break-inside-avoid rounded-2xl border border-border-default bg-surface p-6 shadow-sm transition-all duration-200 hover:border-brand/20 hover:shadow-[0_12px_40px_-12px_rgba(225, 29, 46,0.12)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white"
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
    </motion.article>
  );
}

export default function Testimonials({ items }: { items: TestimonialRow[] }) {
  const consented = items.filter((row) => row.consent_given_at);

  return (
    <section aria-label="Testimonials" className="bg-background py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-4 md:px-6 min-[1025px]:px-8">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-fg-tertiary">
            Prep for interviews at teams like
          </p>
          <div className="mt-6">
            <CompanyLogoStrip />
          </div>
        </div>

        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
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
            {consented.map((item, index) => (
              <TestimonialCard key={item.id} item={item} index={index} />
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
