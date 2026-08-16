"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Bot,
  DollarSign,
  Radar,
  Star,
  Target,
  type LucideIcon,
} from "lucide-react";
import { SourceBrandIcon } from "@/components/brand/brand-icons";
import type { SourceBrand } from "@/lib/brands";
import { cn } from "@/lib/utils";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  badge: string;
  badgeClass: string;
  href: string;
  anchorId?: string;
  sources?: SourceBrand[];
};

const FEATURES: Feature[] = [
  {
    icon: Radar,
    title: "Hidden Job Discovery",
    description:
      "AI crawls Reddit, Twitter, Discord, Slack, and 50+ private networks to surface roles posted nowhere else. Get first-mover advantage.",
    badge: "50+ Sources",
    badgeClass: "bg-info-50 text-info",
    href: "#how-it-works",
    sources: ["reddit", "x", "discord", "slack"],
  },
  {
    icon: Target,
    title: "AI Match Scoring",
    description:
      "Every job gets a personalized match score based on your skills, experience, and preferences. Focus only on roles where you have real shot.",
    badge: "92% Accuracy",
    badgeClass: "bg-success-50 text-success",
    href: "#how-it-works",
  },
  {
    icon: BookOpen,
    title: "Interview Vault",
    description:
      "Company-specific interview questions, insider tips, and prep guides — crowdsourced and AI-enhanced. Know what to expect before you walk in.",
    badge: "10K+ Questions",
    badgeClass: "bg-info-50 text-info",
    href: "#interview-vault",
  },
  {
    icon: Star,
    title: "Career Identity Profile",
    description:
      "Your public career page beyond a resume — showcase skills, GitHub, certifications, and projects. Share with recruiters in one link.",
    badge: "Public Profile",
    badgeClass: "bg-surface-active text-fg-secondary",
    href: "/profile",
    sources: ["linkedin", "github"],
  },
  {
    icon: Bot,
    title: "Smart Apply Assistant",
    description:
      "One-click applications with AI-tailored cover letters and resume tweaks per role. Apply to 10x more jobs in the same time.",
    badge: "Coming Soon",
    badgeClass: "bg-warning-50 text-warning",
    href: "#features",
  },
  {
    icon: DollarSign,
    title: "Sell Your Interview Guides",
    description:
      "Turn your interview experience into income. Write prep guides for companies you've interviewed at and earn every time someone buys.",
    badge: "Earn $$$",
    badgeClass: "bg-brand-50 text-brand",
    href: "/interview-vault/sell",
  },
];

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const prefersReducedMotion = useReducedMotion();
  const Icon = feature.icon;

  return (
    <motion.article
      ref={ref}
      id={feature.anchorId}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group flex h-full flex-col rounded-2xl border border-border-default bg-surface p-8 transition-all duration-200 ease-in-out hover:scale-[1.02] hover:border-brand hover:shadow-[0_12px_40px_-12px_rgba(225, 29, 46,0.18)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex size-12 items-center justify-center rounded-xl bg-brand text-white shadow-sm"
          aria-hidden
        >
          <Icon className="size-6" strokeWidth={2} />
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
            feature.badgeClass,
          )}
        >
          {feature.badge}
        </span>
      </div>

      <h3 className="mt-5 font-heading text-xl font-bold text-fg-primary">{feature.title}</h3>
      <p className="mt-3 flex-1 text-md leading-relaxed text-fg-secondary">
        {feature.description}
      </p>

      {feature.sources && (
        <div className="mt-4 flex items-center gap-2">
          {feature.sources.map((source) => (
            <span
              key={source}
              className="flex size-7 items-center justify-center rounded-md border border-border-default bg-surface-hover"
              title={source}
            >
              <SourceBrandIcon brand={source} className="size-3.5" />
            </span>
          ))}
        </div>
      )}

      <Link
        href={feature.href}
        className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand opacity-80 transition-all duration-200 group-hover:gap-2 group-hover:opacity-100"
      >
        Learn more
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </motion.article>
  );
}

export default function Features() {
  return (
    <section id="features" aria-label="Features" className="bg-surface py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-4 md:px-6 min-[1025px]:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
            Everything you need
          </p>
          <h2 className="wg-section-heading mt-4 font-heading font-bold tracking-tight text-fg-primary">
            One platform to find, prep, and land your dream job
          </h2>
          <p className="mt-4 text-lg text-fg-secondary">
            Stop juggling 10 tabs. WorkGraph brings intelligence to your entire job search.
          </p>
        </header>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
