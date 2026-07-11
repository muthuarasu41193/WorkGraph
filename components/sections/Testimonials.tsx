"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const HIRED_AT = [
  "Google",
  "Meta",
  "Amazon",
  "Stripe",
  "Netflix",
  "Microsoft",
  "Apple",
  "Airbnb",
] as const;

type Testimonial = {
  name: string;
  role: string;
  avatar: string;
  avatarColor: string;
  text: string;
  tall?: boolean;
  sourceBadge?: string;
  salaryBump?: string;
  earningsBadge?: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Sarah K.",
    role: "Software Engineer → Google",
    avatar: "S",
    avatarColor: "bg-[#C41E3A]",
    text: "WorkGraph showed me a Google role posted in a Discord server 3 hours before it hit LinkedIn. I applied first, prepped with the Interview Vault, and got the offer. This is genuinely a game-changer.",
    tall: true,
    sourceBadge: "PRO NETWORK",
    salaryBump: "+$45K salary increase",
  },
  {
    name: "Marcus T.",
    role: "Product Manager",
    avatar: "M",
    avatarColor: "bg-[#2563EB]",
    text: "The AI match score is scary accurate. It told me I had 89% match for a role — I got an interview within 48 hours. Skipped 50+ 'not a fit' applications.",
  },
  {
    name: "Priya R.",
    role: "Data Scientist",
    avatar: "P",
    avatarColor: "bg-[#7C3AED]",
    text: "I wrote a guide about my Netflix interview and made $340 in the first month. WorkGraph literally paid for itself 10x over.",
    earningsBadge: "Earned $340",
  },
  {
    name: "James L.",
    role: "DevOps Engineer → Stripe",
    avatar: "J",
    avatarColor: "bg-[#16A34A]",
    text: "Found a Stripe role through a Reddit thread WorkGraph surfaced. The Interview Vault had EXACTLY the questions they asked. Felt like I had the answers before the interview.",
    sourceBadge: "REDDIT",
  },
  {
    name: "Aisha M.",
    role: "Frontend Developer",
    avatar: "A",
    avatarColor: "bg-[#D97706]",
    text: "Applied to 8 jobs in one morning using the AI cover letter tool. Got 3 callbacks. Previously I'd spend 2 hours per application.",
  },
  {
    name: "David C.",
    role: "Full Stack → Netflix",
    avatar: "D",
    avatarColor: "bg-[#0A0A0A]",
    text: "The hidden job discovery is real. 4 out of my last 5 interviews came from sources I'd never have found manually. Landed a $210K role at Netflix.",
    salaryBump: "$210K offer",
  },
];

function StarRating() {
  return (
    <div className="flex gap-0.5 text-[#F59E0B]" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="size-3.5 fill-current" aria-hidden />
      ))}
    </div>
  );
}

function TestimonialCard({ item, index }: { item: Testimonial; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.article
      ref={ref}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group break-inside-avoid rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-sm transition-all duration-200 hover:border-[#C41E3A]/20 hover:shadow-[0_12px_40px_-12px_rgba(196,30,58,0.12)] hover:bg-gradient-to-br hover:from-white hover:to-[#FFF5F5]/40",
        item.tall && "lg:min-h-[280px]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
              item.avatarColor,
            )}
            aria-hidden
          >
            {item.avatar}
          </div>
          <div>
            <p className="font-semibold text-[#0A0A0A]">{item.name}</p>
            <p className="text-xs text-[#8A8A8A]">{item.role}</p>
          </div>
        </div>
        <StarRating />
      </div>

      {(item.sourceBadge || item.earningsBadge || item.salaryBump) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {item.sourceBadge && (
            <span className="rounded-full bg-[#F3F2EF] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#4A4A4A]">
              {item.sourceBadge}
            </span>
          )}
          {item.earningsBadge && (
            <span className="rounded-full bg-[#F0FDF4] px-2.5 py-1 text-[10px] font-bold text-[#16A34A]">
              {item.earningsBadge}
            </span>
          )}
          {item.salaryBump && (
            <span className="rounded-full bg-[#FFF0F0] px-2.5 py-1 text-[10px] font-bold text-[#C41E3A]">
              {item.salaryBump}
            </span>
          )}
        </div>
      )}

      <blockquote className="mt-4 text-[15px] leading-relaxed text-[#4A4A4A]">
        &ldquo;{item.text}&rdquo;
      </blockquote>
    </motion.article>
  );
}

export default function Testimonials() {
  return (
    <section aria-label="Testimonials" className="bg-[#F8F7F4] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        {/* Logo strip */}
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#8A8A8A]">
            Trusted by people hired at:
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {HIRED_AT.map((company) => (
              <span
                key={company}
                className="font-heading text-sm font-semibold text-[#8A8A8A]/70 transition-colors hover:text-[#4A4A4A]"
              >
                {company}
              </span>
            ))}
          </div>
        </div>

        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C41E3A]">
            Loved by job seekers
          </p>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-[#0A0A0A] sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            People are landing jobs they never knew existed
          </h2>
        </header>

        {/* Masonry grid */}
        <div className="mt-14 columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
          {TESTIMONIALS.map((item, index) => (
            <TestimonialCard key={item.name} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
