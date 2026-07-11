"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HERO } from "@/lib/constants";
import { FadeIn } from "./FadeIn";
import { SectionContainer } from "./SectionContainer";

function HeroVisual() {
  return (
    <div
      className="relative mx-auto w-full max-w-lg lg:max-w-none"
      aria-hidden
    >
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-wg-primary/20 via-transparent to-wg-accent-blue/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
        <div className="border-b border-border bg-surface-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-wg-primary" />
            <span className="size-2.5 rounded-full bg-warning" />
            <span className="size-2.5 rounded-full bg-success" />
            <span className="ml-2 text-xs text-foreground-muted">WorkGraph Intelligence</span>
          </div>
        </div>
        <div className="space-y-3 p-4 sm:p-6">
          {[
            { role: "Staff Engineer", company: "Stealth AI", match: "96%", source: "Discord", new: true },
            { role: "Senior PM", company: "Series B Fintech", match: "91%", source: "Reddit", new: false },
            { role: "ML Engineer", company: "HealthTech", match: "88%", source: "Twitter", new: true },
          ].map((job) => (
            <div
              key={job.role}
              className="flex items-center justify-between rounded-xl border border-border bg-background p-3 transition-colors hover:border-wg-primary/30"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{job.role}</p>
                <p className="truncate text-xs text-foreground-muted">
                  {job.company} · via {job.source}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {job.new && (
                  <span className="rounded-full bg-wg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-wg-primary">
                    New
                  </span>
                )}
                <span className="text-sm font-semibold text-success">{job.match}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <SectionContainer
      as="section"
      ariaLabel="Hero"
      className="relative overflow-hidden pb-12 pt-8 sm:pb-16 sm:pt-12 lg:pb-20 lg:pt-16"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(196,30,58,0.12),transparent)]"
        aria-hidden
      />

      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-8">
          <FadeIn>
            <Badge
              variant="outline"
              className="gap-1.5 border-wg-primary/20 bg-wg-primary/5 px-3 py-1 text-xs font-medium text-wg-primary"
            >
              <Sparkles className="size-3" aria-hidden />
              {HERO.badge}
            </Badge>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {HERO.headline.split(" ").map((word, i) =>
                word === "LinkedIn" ? (
                  <span key={i} className="text-wg-primary">
                    {word}{" "}
                  </span>
                ) : (
                  <span key={i}>{word} </span>
                ),
              )}
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="max-w-xl text-lg leading-relaxed text-foreground-secondary">
              {HERO.subheadline}
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="premium" className="h-12 px-8 text-base" asChild>
                <Link href={HERO.primaryCta.href}>
                  {HERO.primaryCta.label}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button variant="outline" size="premium" className="h-12 px-8 text-base" asChild>
                <Link href={HERO.secondaryCta.href}>{HERO.secondaryCta.label}</Link>
              </Button>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <dl className="grid grid-cols-3 gap-4 border-t border-border pt-8">
              {HERO.stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                    {stat.value}
                  </dd>
                  <dd className="mt-0.5 text-xs text-foreground-muted sm:text-sm">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </FadeIn>
        </div>

        <FadeIn delay={0.2} direction="none">
          <HeroVisual />
        </FadeIn>
      </div>
    </SectionContainer>
  );
}
