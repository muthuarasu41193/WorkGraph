import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CTA } from "@/lib/constants";
import { FadeIn } from "./FadeIn";
import { SectionContainer } from "./SectionContainer";

export function CtaSection() {
  return (
    <SectionContainer ariaLabel="Call to action">
      <FadeIn>
        <div className="relative overflow-hidden rounded-3xl border border-wg-primary/20 bg-gradient-to-br from-wg-primary/5 via-surface to-wg-accent-blue/5 px-8 py-16 text-center sm:px-12 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(196,30,58,0.08),transparent_60%)]"
            aria-hidden
          />
          <div className="relative">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {CTA.headline}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-foreground-secondary">
              {CTA.subheadline}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="premium" className="h-12 px-8 text-base" asChild>
                <Link href={CTA.primaryCta.href}>
                  {CTA.primaryCta.label}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button variant="ghost" size="premium" className="h-12 px-8 text-base" asChild>
                <Link href={CTA.secondaryCta.href}>{CTA.secondaryCta.label}</Link>
              </Button>
            </div>
          </div>
        </div>
      </FadeIn>
    </SectionContainer>
  );
}
