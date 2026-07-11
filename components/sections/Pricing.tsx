"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

type BillingPeriod = "monthly" | "annual";

type PricingFeature = {
  text: string;
  included: boolean;
};

type PricingTier = {
  id: string;
  name: string;
  badge?: string;
  badgeVariant?: "popular" | "enterprise";
  monthlyPrice: number;
  annualMonthlyPrice: number;
  annualBilled: number;
  tagline: string;
  cta: { label: string; href: string; style: "outline" | "primary" | "dark" };
  features: PricingFeature[];
  highlighted?: boolean;
};

const TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 0,
    annualMonthlyPrice: 0,
    annualBilled: 0,
    tagline: "For casual explorers",
    cta: { label: "Start Free", href: "/signup", style: "outline" },
    features: [
      { text: "Up to 50 job discoveries/month", included: true },
      { text: "Basic AI match scoring", included: true },
      { text: "3 Interview Vault previews/month", included: true },
      { text: "Public career profile", included: true },
      { text: "Email job alerts", included: true },
      { text: "Hidden job sources", included: false },
      { text: "Auto-apply assistant", included: false },
      { text: "Sell interview guides", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    badge: "MOST POPULAR",
    badgeVariant: "popular",
    monthlyPrice: 29,
    annualMonthlyPrice: 17,
    annualBilled: 204,
    tagline: "For serious job seekers",
    cta: { label: "Get Pro Access", href: "/signup", style: "primary" },
    highlighted: true,
    features: [
      { text: "Unlimited job discoveries", included: true },
      { text: "Advanced AI match scoring (92%+ accuracy)", included: true },
      { text: "Full Interview Vault access (10,000+ Q&As)", included: true },
      { text: "Public career profile + analytics", included: true },
      { text: "Real-time job alerts (instant)", included: true },
      { text: "All 50+ hidden job sources", included: true },
      { text: "AI cover letter generator", included: true },
      { text: "Application tracker", included: true },
      { text: "Sell interview guides (keep 80%)", included: true },
      { text: "Priority email support", included: true },
      { text: "Team features", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    id: "teams",
    name: "Teams",
    badge: "FOR COMPANIES",
    badgeVariant: "enterprise",
    monthlyPrice: 99,
    annualMonthlyPrice: 59,
    annualBilled: 708,
    tagline: "For recruiting teams & bootcamps",
    cta: { label: "Contact Sales", href: "#contact", style: "dark" },
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Up to 10 team members", included: true },
      { text: "Team analytics dashboard", included: true },
      { text: "Bulk job discovery", included: true },
      { text: "White-label career profiles", included: true },
      { text: "API access", included: true },
      { text: "Custom job source integration", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "SLA guarantee", included: true },
      { text: "Custom invoicing", included: true },
    ],
  },
];

const FAQ_ITEMS = [
  {
    question: "Is WorkGraph really free to start?",
    answer:
      "Yes. Our Starter plan is completely free with no credit card required. You get 50 job discoveries per month and basic features to test the platform.",
  },
  {
    question: "How does the hidden job discovery work?",
    answer:
      "Our AI monitors 50+ sources including Reddit communities, Twitter/X job threads, Discord servers, Slack groups, and private professional networks — all in real-time.",
  },
  {
    question: "Can I really earn money selling interview guides?",
    answer:
      "Absolutely. Pro users can publish interview guides for companies they've interviewed at. You keep 80% of every sale. Top sellers earn $500-2000/month.",
  },
  {
    question: "What's your refund policy?",
    answer: "We offer a 14-day money-back guarantee, no questions asked.",
  },
  {
    question: "How is WorkGraph different from LinkedIn Premium?",
    answer:
      "LinkedIn shows you the same public jobs everyone sees. WorkGraph surfaces jobs never posted on LinkedIn — from Reddit, Discord, Twitter, and private networks — and gives you AI-powered match scores and interview prep.",
  },
] as const;

function BillingToggle({
  period,
  onChange,
}: {
  period: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
}) {
  const isAnnual = period === "annual";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative inline-flex rounded-full border border-[#E5E5E5] bg-[#F3F2EF] p-1"
        role="group"
        aria-label="Billing period"
      >
        <motion.div
          className="absolute inset-y-1 rounded-full bg-white shadow-sm"
          layout
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          style={{
            width: "calc(50% - 4px)",
            left: isAnnual ? "calc(50% + 2px)" : "4px",
          }}
        />
        <button
          type="button"
          onClick={() => onChange("monthly")}
          className={cn(
            "relative z-10 rounded-full px-5 py-2 text-sm font-semibold transition-colors",
            !isAnnual ? "text-[#0A0A0A]" : "text-[#8A8A8A]",
          )}
          aria-pressed={!isAnnual}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onChange("annual")}
          className={cn(
            "relative z-10 rounded-full px-5 py-2 text-sm font-semibold transition-colors",
            isAnnual ? "text-[#0A0A0A]" : "text-[#8A8A8A]",
          )}
          aria-pressed={isAnnual}
        >
          Annual
        </button>
      </div>
      <AnimatePresence mode="wait">
        {isAnnual && (
          <motion.span
            key="save-badge"
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="rounded-full bg-[#F0FDF4] px-3 py-1 text-xs font-bold text-[#16A34A]"
          >
            Save 40%
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeatureItem({ feature }: { feature: PricingFeature }) {
  return (
    <li
      className={cn(
        "flex items-start gap-3 text-[15px] leading-snug",
        feature.included ? "text-[#4A4A4A]" : "text-[#8A8A8A]",
      )}
    >
      {feature.included ? (
        <Check className="mt-0.5 size-4 shrink-0 text-[#16A34A]" aria-hidden />
      ) : (
        <X className="mt-0.5 size-4 shrink-0 text-[#C41E3A]/70" aria-hidden />
      )}
      <span className={cn(!feature.included && "opacity-70")}>{feature.text}</span>
    </li>
  );
}

function PricingCard({
  tier,
  period,
  index,
}: {
  tier: PricingTier;
  period: BillingPeriod;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const prefersReducedMotion = useReducedMotion();
  const isAnnual = period === "annual";
  const displayPrice = isAnnual ? tier.annualMonthlyPrice : tier.monthlyPrice;
  const showBillingNote = tier.monthlyPrice > 0 && isAnnual;

  return (
    <motion.article
      ref={ref}
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.94 }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative flex flex-col rounded-[20px] border p-10",
        tier.highlighted
          ? "z-10 border-[#C41E3A] bg-[#FFF8F8] shadow-[0_20px_60px_-20px_rgba(196,30,58,0.25)] lg:scale-105"
          : "border-[#E5E5E5] bg-white shadow-sm",
      )}
    >
      {tier.badge && (
        <span
          className={cn(
            "absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white",
            tier.badgeVariant === "popular" ? "bg-[#C41E3A]" : "bg-[#0A0A0A]",
          )}
        >
          {tier.badge}
        </span>
      )}

      <div className="text-center">
        <h3 className="font-heading text-xl font-bold text-[#0A0A0A]">{tier.name}</h3>
        <p className="mt-1 text-sm text-[#8A8A8A]">{tier.tagline}</p>

        <div className="mt-6 flex flex-col items-center">
          <div className="flex items-baseline justify-center gap-1">
            <AnimatePresence mode="wait">
              <motion.span
                key={`${tier.id}-${period}-price`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="font-heading text-5xl font-extrabold tracking-tight text-[#0A0A0A]"
              >
                ${displayPrice}
              </motion.span>
            </AnimatePresence>
            <span className="text-[#8A8A8A]">/month</span>
          </div>
          {showBillingNote && (
            <AnimatePresence mode="wait">
              <motion.p
                key={`${tier.id}-billed`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-1 text-xs text-[#8A8A8A]"
              >
                billed ${tier.annualBilled}/yr
              </motion.p>
            </AnimatePresence>
          )}
        </div>
      </div>

      <Link
        href={tier.cta.href}
        className={cn(
          "mt-8 inline-flex w-full items-center justify-center rounded-full font-semibold transition-all duration-200 ease-in-out hover:scale-[1.02]",
          tier.cta.style === "outline" &&
            "border-2 border-[#C41E3A] bg-transparent py-3 text-[#C41E3A] hover:bg-[#FFF5F5]",
          tier.cta.style === "primary" &&
            "bg-[#C41E3A] py-3.5 text-base text-white shadow-md hover:bg-[#A01830] hover:shadow-lg",
          tier.cta.style === "dark" &&
            "bg-[#0A0A0A] py-3 text-white hover:bg-[#1A1A1A]",
        )}
      >
        {tier.cta.label}
      </Link>

      <ul className="mt-8 flex flex-1 flex-col gap-3.5" role="list">
        {tier.features.map((feature) => (
          <FeatureItem key={feature.text} feature={feature} />
        ))}
      </ul>
    </motion.article>
  );
}

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="mx-auto mt-16 max-w-3xl">
      <h3 className="text-center font-heading text-2xl font-bold text-[#0A0A0A] sm:text-3xl">
        Frequently asked questions
      </h3>
      <div className="mt-8 divide-y divide-[#E5E5E5] rounded-2xl border border-[#E5E5E5] bg-white">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={item.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-[#F8F7F4]/60"
                aria-expanded={isOpen}
              >
                <span className="font-semibold text-[#0A0A0A]">{item.question}</span>
                <ChevronDown
                  className={cn(
                    "size-5 shrink-0 text-[#8A8A8A] transition-transform duration-300",
                    isOpen && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
              <motion.div
                initial={false}
                animate={{
                  height: isOpen ? "auto" : 0,
                  opacity: isOpen ? 1 : 0,
                }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
                }
                className="overflow-hidden"
              >
                <p className="px-6 pb-5 text-[15px] leading-relaxed text-[#4A4A4A]">
                  {item.answer}
                </p>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EnterpriseCta() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mt-16 rounded-[20px] bg-[#0A0A0A] px-8 py-12 text-center sm:px-12"
    >
      <p className="font-heading text-xl font-bold text-white sm:text-2xl">
        Need a custom plan for your company or bootcamp?
      </p>
      <Link
        href="#contact"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-base font-semibold text-[#0A0A0A] transition-all duration-200 hover:scale-[1.02] hover:bg-[#F3F2EF]"
      >
        Contact Sales →
      </Link>
      <p className="mt-4 text-sm text-[#8A8A8A]">
        We work with recruiting firms, coding bootcamps, and universities
      </p>
    </motion.div>
  );
}

export default function Pricing() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  return (
    <section id="pricing" aria-label="Pricing" className="bg-white py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C41E3A]">
            SIMPLE PRICING
          </p>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-[#0A0A0A] sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            Start free. Upgrade when you&apos;re ready.
          </h2>
          <p className="mt-4 text-lg text-[#4A4A4A]">
            No hidden fees. No long-term contracts. Cancel anytime.
          </p>
        </header>

        <div className="mt-10">
          <BillingToggle period={period} onChange={setPeriod} />
        </div>

        <div className="mt-12 grid items-center gap-8 lg:grid-cols-3 lg:gap-6">
          {TIERS.map((tier, index) => (
            <PricingCard key={tier.id} tier={tier} period={period} index={index} />
          ))}
        </div>

        <FaqAccordion />
        <EnterpriseCta />
      </div>
    </section>
  );
}
