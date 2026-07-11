"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Check, MapPin, Briefcase, DollarSign, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = {
  number: string;
  title: string;
  description: string;
  highlights: string[];
  visual: "profile" | "jobs" | "interview" | "earnings";
};

const STEPS: Step[] = [
  {
    number: "01",
    title: "Build Your Career Profile",
    description:
      "Set up your WorkGraph profile with skills, experience level, salary expectations, and target roles. Takes 5 minutes.",
    highlights: ["Professional Bio", "Skills & Tools", "Salary Range", "Work Preferences"],
    visual: "profile",
  },
  {
    number: "02",
    title: "AI Discovers Hidden Opportunities",
    description:
      "Our AI continuously scans 50+ sources and surfaces relevant jobs with match scores. New jobs appear in your feed in real-time.",
    highlights: ["Reddit & Twitter", "Discord Communities", "Pro Networks", "Real-time Alerts"],
    visual: "jobs",
  },
  {
    number: "03",
    title: "Prep with Interview Intelligence",
    description:
      "Access company-specific interview questions, past experiences, and AI-generated prep guides before every interview.",
    highlights: [
      "Company-specific Q&A",
      "Behavioral Questions",
      "Technical Deep-dives",
      "Salary Negotiation",
    ],
    visual: "interview",
  },
  {
    number: "04",
    title: "Apply Smart, Earn on the Side",
    description:
      "Use AI-assisted applications to apply faster. Then share your interview experience and earn passive income from your guides.",
    highlights: ["AI Cover Letters", "One-click Apply", "Sell Guides", "Track Applications"],
    visual: "earnings",
  },
];

function HighlightPills({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 flex flex-wrap gap-2" role="list">
      {items.map((item) => (
        <li
          key={item}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 py-1.5 text-xs font-medium text-[#4A4A4A]"
        >
          <Check className="size-3.5 text-[#16A34A]" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

function ProfileMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-[0_16px_48px_-12px_rgba(10,10,10,0.12)]">
      <div className="h-20 bg-gradient-to-r from-[#C41E3A]/20 to-[#2563EB]/10" />
      <div className="px-5 pb-5">
        <div className="-mt-8 flex items-end gap-3">
          <div className="flex size-16 items-center justify-center rounded-2xl border-4 border-white bg-[#0A0A0A] text-lg font-bold text-white shadow-md">
            RK
          </div>
          <div className="mb-1">
            <p className="font-heading text-lg font-bold text-[#0A0A0A]">Ronaldo K.</p>
            <p className="text-sm text-[#8A8A8A]">Senior Product Designer</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-[#8A8A8A]">
          <MapPin className="size-3.5" aria-hidden />
          San Francisco · Open to remote
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {["Figma", "React", "Design Systems", "User Research"].map((skill) => (
            <span
              key={skill}
              className="rounded-lg bg-[#F3F2EF] px-2.5 py-1.5 text-center text-xs font-medium text-[#4A4A4A]"
            >
              {skill}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-[#F8F7F4] px-3 py-2.5 text-sm">
          <span className="text-[#8A8A8A]">Salary range</span>
          <span className="font-semibold text-[#0A0A0A]">$140k – $175k</span>
        </div>
      </div>
    </div>
  );
}

function JobFeedMockup() {
  const jobs = [
    { role: "Staff Engineer", company: "Stealth AI", source: "Discord", match: 96 },
    { role: "Lead Designer", company: "Series B", source: "Reddit", match: 89 },
    { role: "VP Product", company: "Fintech", source: "Twitter", match: 84 },
  ];

  return (
    <div className="space-y-2.5 rounded-2xl border border-[#E5E5E5] bg-[#F8F7F4] p-4 shadow-[0_16px_48px_-12px_rgba(10,10,10,0.12)]">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#8A8A8A]">Live feed</p>
      {jobs.map((job) => (
        <div
          key={job.role}
          className="flex items-center justify-between rounded-xl border border-[#E5E5E5] bg-white p-3"
        >
          <div>
            <p className="text-sm font-semibold text-[#0A0A0A]">{job.role}</p>
            <p className="text-xs text-[#8A8A8A]">{job.company}</p>
            <span className="mt-1.5 inline-block rounded-full bg-[#FFF0F0] px-2 py-0.5 text-[10px] font-semibold text-[#C41E3A]">
              {job.source}
            </span>
          </div>
          <span className="font-heading text-sm font-bold text-[#16A34A]">{job.match}%</span>
        </div>
      ))}
    </div>
  );
}

function InterviewMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-[0_16px_48px_-12px_rgba(10,10,10,0.12)]">
      <div className="border-b border-[#E5E5E5] bg-[#FFF0F0] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
          Interview Vault
        </p>
        <p className="mt-0.5 font-heading text-base font-bold text-[#0A0A0A]">Google — L5 PM</p>
      </div>
      <div className="space-y-2 p-4">
        {[
          "Tell me about a product you shipped from 0→1",
          "How do you prioritize a crowded roadmap?",
          "Design a metrics dashboard for creators",
        ].map((q, i) => (
          <div key={q} className="rounded-lg bg-[#F8F7F4] px-3 py-2.5 text-sm text-[#4A4A4A]">
            <span className="mr-2 font-bold text-[#C41E3A]">Q{i + 1}.</span>
            {q}
          </div>
        ))}
        <div className="mt-2 rounded-lg border border-dashed border-[#C41E3A]/30 bg-[#FFF5F5] px-3 py-2 text-center text-xs font-semibold text-[#C41E3A]">
          + AI-generated prep guide available
        </div>
      </div>
    </div>
  );
}

function EarningsMockup() {
  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-[0_16px_48px_-12px_rgba(10,10,10,0.12)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#8A8A8A]">
            Guide earnings
          </p>
          <p className="mt-1 font-heading text-3xl font-extrabold text-[#0A0A0A]">$1,248</p>
          <p className="text-xs text-[#16A34A]">+18% this month</p>
        </div>
        <div className="flex size-12 items-center justify-center rounded-xl bg-[#F0FDF4] text-[#16A34A]">
          <TrendingUp className="size-6" aria-hidden />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        {[
          { label: "Applications sent", value: "24", icon: Briefcase },
          { label: "Guides sold", value: "37", icon: DollarSign },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-xl bg-[#F8F7F4] px-3 py-2.5"
          >
            <span className="flex items-center gap-2 text-sm text-[#4A4A4A]">
              <Icon className="size-4 text-[#8A8A8A]" aria-hidden />
              {label}
            </span>
            <span className="font-semibold text-[#0A0A0A]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepVisual({ type }: { type: Step["visual"] }) {
  switch (type) {
    case "profile":
      return <ProfileMockup />;
    case "jobs":
      return <JobFeedMockup />;
    case "interview":
      return <InterviewMockup />;
    case "earnings":
      return <EarningsMockup />;
  }
}

function StepBlock({ step, index }: { step: Step; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReducedMotion = useReducedMotion();
  const isEven = index % 2 === 1;
  const isLast = index === STEPS.length - 1;

  return (
    <div ref={ref} className="relative">
      {!isLast && (
        <div
          className={cn(
            "absolute z-0 hidden lg:block",
            isEven
              ? "left-1/2 top-full h-16 w-px -translate-x-1/2 bg-gradient-to-b from-[#FECACA] to-transparent"
              : "left-1/2 top-full h-16 w-px -translate-x-1/2 bg-gradient-to-b from-[#FECACA] to-transparent",
          )}
          aria-hidden
        />
      )}

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
          isEven && "lg:[&>div:first-child]:order-2 lg:[&>div:last-child]:order-1",
        )}
      >
        {/* Content */}
        <div className="relative">
          <span
            className="pointer-events-none absolute -left-2 -top-6 select-none font-heading text-[120px] font-extrabold leading-none text-[#FFF0F0] sm:text-[140px] lg:-left-4 lg:-top-10 lg:text-[160px]"
            aria-hidden
          >
            {step.number}
          </span>
          <div className="relative">
            <p className="text-sm font-bold text-[#C41E3A]">Step {step.number}</p>
            <h3 className="mt-2 font-heading text-2xl font-bold text-[#0A0A0A] sm:text-3xl">
              {step.title}
            </h3>
            <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-[#4A4A4A]">
              {step.description}
            </p>
            <HighlightPills items={step.highlights} />
          </div>
        </div>

        {/* Visual */}
        <div className="relative">
          <div
            className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-[#C41E3A]/5 to-transparent"
            aria-hidden
          />
          <div className="relative">
            <StepVisual type={step.visual} />
          </div>
        </div>
      </motion.div>

      {/* Mobile connector */}
      {!isLast && (
        <div
          className="mx-auto my-10 h-12 w-px bg-gradient-to-b from-[#FECACA] to-transparent lg:hidden"
          aria-hidden
        />
      )}
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-label="How it works"
      className="bg-[#F8F7F4] py-20 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C41E3A]">The process</p>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-[#0A0A0A] sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            From hidden job to hired — in 4 steps
          </h2>
        </header>

        <div className="relative mt-16 lg:mt-20">
          {/* Desktop zigzag line */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#FECACA]/60 to-transparent lg:block"
            aria-hidden
          />

          <div className="relative space-y-0 lg:space-y-24">
            {STEPS.map((step, index) => (
              <StepBlock key={step.number} step={step} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
