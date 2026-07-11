"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { ArrowRight, ChevronDown, CirclePlay, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AVATARS = [
  { initials: "PM", color: "bg-[#2563EB]" },
  { initials: "JK", color: "bg-[#C41E3A]" },
  { initials: "SL", color: "bg-[#16A34A]" },
  { initials: "AR", color: "bg-[#D97706]" },
  { initials: "KT", color: "bg-[#7C3AED]" },
] as const;

const DASHBOARD_STATS = [
  { label: "Jobs Found", value: 247, suffix: "" },
  { label: "Applied", value: 18, suffix: "" },
  { label: "Top Match", value: 92, suffix: "%" },
  { label: "Interviews", value: 3, suffix: "" },
] as const;

const JOB_CARDS = [
  {
    company: "S",
    companyColor: "bg-[#0A0A0A]",
    role: "Staff Engineer",
    salary: "$185k–$220k",
    source: "Discord",
    timeAgo: "2h ago",
    match: 96,
  },
  {
    company: "F",
    companyColor: "bg-[#2563EB]",
    role: "Senior Product Manager",
    salary: "$150k–$175k",
    source: "Reddit",
    timeAgo: "5h ago",
    match: 91,
  },
  {
    company: "H",
    companyColor: "bg-[#16A34A]",
    role: "ML Engineer",
    salary: "$160k–$195k",
    source: "Twitter",
    timeAgo: "1d ago",
    match: 84,
  },
] as const;

const TRUST_BADGES = ["No credit card", "500 spot limit", "Cancel anytime"] as const;

const leftContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const leftItem: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

function CountUp({
  end,
  suffix = "",
  duration = 1.6,
  className,
}: {
  end: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [value, setValue] = useState(prefersReducedMotion ? end : 0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(end);
      return;
    }

    const startTime = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(eased * end));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [end, duration, prefersReducedMotion]);

  return (
    <span className={className}>
      {value}
      {suffix}
    </span>
  );
}

function MatchRing({ match }: { match: number }) {
  const isHigh = match >= 90;
  const color = isHigh ? "#16A34A" : "#D97706";
  const circumference = 2 * Math.PI * 14;
  const offset = circumference - (match / 100) * circumference;

  return (
    <div className="relative flex size-9 shrink-0 items-center justify-center">
      <svg className="-rotate-90 size-9" viewBox="0 0 36 36" aria-hidden>
        <circle cx="18" cy="18" r="14" fill="none" stroke="#E5E5E5" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span
        className="absolute text-[10px] font-bold"
        style={{ color }}
        aria-label={`${match}% match`}
      >
        {match}
      </span>
    </div>
  );
}

function DashboardMockup() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, x: 48 }}
      animate={{ opacity: 1, x: 0 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 90, damping: 20, delay: 0.2 }
      }
      className={cn(
        "relative w-full max-w-[480px] lg:max-w-none",
        !prefersReducedMotion && "animate-[hero-bob_6s_ease-in-out_infinite]",
      )}
    >
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-[#C41E3A]/10 blur-3xl"
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-[0_24px_64px_-12px_rgba(10,10,10,0.18)]">
        {/* Browser chrome */}
        <div className="flex items-center gap-3 border-b border-[#E5E5E5] bg-[#F3F2EF] px-4 py-3">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-[#FF5F57]" />
            <span className="size-2.5 rounded-full bg-[#FFBD2E]" />
            <span className="size-2.5 rounded-full bg-[#28CA41]" />
          </div>
          <div className="flex-1 rounded-md border border-[#E5E5E5] bg-white px-3 py-1 text-center text-[11px] text-[#8A8A8A]">
            app.workgraph.ai
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {/* Stat boxes */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {DASHBOARD_STATS.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + index * 0.08, duration: 0.45 }}
                className="rounded-xl border border-[#E5E5E5] bg-[#F8F7F4] px-3 py-2.5"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-[#8A8A8A]">
                  {stat.label}
                </p>
                <p className="mt-0.5 font-heading text-lg font-bold text-[#0A0A0A]">
                  <CountUp end={stat.value} suffix={stat.suffix} />
                </p>
              </motion.div>
            ))}
          </div>

          {/* Job cards */}
          <div className="space-y-2.5">
            {JOB_CARDS.map((job, index) => (
              <motion.div
                key={job.role}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + index * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-3 rounded-xl border border-[#E5E5E5] bg-white p-3 transition-shadow hover:shadow-sm"
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white",
                    job.companyColor,
                  )}
                  aria-hidden
                >
                  {job.company}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#0A0A0A]">{job.role}</p>
                  <p className="truncate text-xs text-[#8A8A8A]">{job.salary}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full bg-[#FFF5F5] px-2 py-0.5 text-[10px] font-semibold text-[#C41E3A]",
                        !prefersReducedMotion && "animate-[hero-badge-pulse_3s_ease-in-out_infinite]",
                      )}
                      style={{ animationDelay: `${index * 0.4}s` }}
                    >
                      {job.source}
                    </span>
                    <span className="text-[10px] text-[#8A8A8A]">{job.timeAgo}</span>
                  </div>
                </div>

                <MatchRing match={job.match} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Hero() {
  const prefersReducedMotion = useReducedMotion();

  const scrollToHowItWorks = () => {
    document.querySelector("#how-it-works")?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <section
      aria-label="Hero"
      className="relative overflow-hidden bg-gradient-to-b from-[#F8F7F4] to-white pb-20 pt-10 sm:pb-24 sm:pt-14 lg:pb-28 lg:pt-16"
    >
      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#E5E5E5_1px,transparent_1px),linear-gradient(to_bottom,#E5E5E5_1px,transparent_1px)] bg-[size:48px_48px] opacity-[0.35]"
        aria-hidden
      />

      {/* Red orb */}
      <div
        className="pointer-events-none absolute -right-32 -top-32 size-[480px] rounded-full bg-[#C41E3A] opacity-[0.08] blur-[100px]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[3fr_2fr] lg:gap-10 xl:gap-16">
          {/* Left — 60% */}
          <motion.div
            variants={leftContainer}
            initial="hidden"
            animate="show"
            className="order-1 lg:order-none"
          >
            <motion.div variants={leftItem}>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#E5E5E5] bg-white/80 px-4 py-1.5 text-sm font-medium text-[#0A0A0A] shadow-sm backdrop-blur-sm">
                <span aria-hidden>🚀</span>
                AI-Powered Job Intelligence
              </span>
            </motion.div>

            <motion.h1
              variants={leftItem}
              className="mt-6 font-heading text-[48px] font-extrabold leading-[1.05] tracking-tight text-[#0A0A0A] sm:text-[56px] lg:text-[72px]"
            >
              Find Jobs That
              <br />
              Never Hit{" "}
              <span className="relative inline-block text-[#C41E3A]">
                LinkedIn.
                <span
                  className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-[#C41E3A]/40"
                  aria-hidden
                />
              </span>
            </motion.h1>

            <motion.p
              variants={leftItem}
              className="mt-6 max-w-[560px] text-[18px] leading-[1.65] text-[#4A4A4A] sm:text-[20px]"
            >
              WorkGraph surfaces hidden roles from Reddit, Twitter, Discord &amp; 50+
              private sources — then AI-matches you, preps you for interviews, and
              lets you earn by selling your prep guides.
            </motion.p>

            {/* Social proof */}
            <motion.div
              variants={leftItem}
              className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center"
            >
              <div className="flex items-center">
                <div className="flex -space-x-2.5" aria-hidden>
                  {AVATARS.map((avatar) => (
                    <div
                      key={avatar.initials}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white",
                        avatar.color,
                      )}
                    >
                      {avatar.initials}
                    </div>
                  ))}
                </div>
                <p className="ml-3 text-sm font-medium text-[#4A4A4A]">
                  <span className="font-semibold text-[#0A0A0A]">2,400+</span> job seekers
                  already inside
                </p>
              </div>

              <div className="flex items-center gap-1.5" aria-label="Rated 4.9 out of 5 stars">
                <div className="flex text-[#D97706]" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <span className="text-sm font-semibold text-[#0A0A0A]">4.9/5</span>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              variants={leftItem}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Button
                size="lg"
                className="h-12 rounded-full bg-[#C41E3A] px-7 text-base font-semibold text-white shadow-md hover:bg-[#A01830] hover:shadow-lg sm:h-[52px]"
                asChild
              >
                <Link href="/signup">
                  Get Early Access — It&apos;s Free
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="h-12 rounded-full px-6 text-base font-medium text-[#4A4A4A] hover:bg-[#F3F2EF] hover:text-[#0A0A0A] sm:h-[52px]"
                onClick={scrollToHowItWorks}
              >
                <CirclePlay className="size-5 text-[#C41E3A]" aria-hidden />
                See how it works →
              </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              variants={leftItem}
              className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-widest text-[#8A8A8A]"
            >
              {TRUST_BADGES.map((badge, index) => (
                <span key={badge} className="flex items-center gap-2">
                  {index > 0 && (
                    <span className="text-[#D4D4D4]" aria-hidden>
                      ·
                    </span>
                  )}
                  <span>✓ {badge}</span>
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — 40% */}
          <div className="order-2 flex justify-center lg:order-none lg:justify-end">
            <DashboardMockup />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.button
        type="button"
        onClick={scrollToHowItWorks}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-[#8A8A8A] transition-colors hover:text-[#C41E3A]"
        aria-label="Scroll to learn how it works"
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest">Scroll</span>
        <ChevronDown
          className={cn(
            "size-5",
            !prefersReducedMotion && "animate-[hero-bounce_2s_ease-in-out_infinite]",
          )}
          aria-hidden
        />
      </motion.button>
    </section>
  );
}
