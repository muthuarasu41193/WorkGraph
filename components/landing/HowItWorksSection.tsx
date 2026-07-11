import { STEPS } from "@/lib/constants";
import { FadeIn } from "./FadeIn";
import { SectionContainer } from "./SectionContainer";

export function HowItWorksSection() {
  return (
    <SectionContainer
      id="how-it-works"
      ariaLabel="How it works"
      className="bg-surface-2"
    >
      <FadeIn className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-wg-primary">
          How it works
        </p>
        <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          From hidden signal to offer letter
        </h2>
        <p className="mt-4 text-lg text-foreground-secondary">
          Three steps to surface opportunities others miss and land them with confidence.
        </p>
      </FadeIn>

      <ol className="mt-14 grid gap-8 md:grid-cols-3" aria-label="Steps to get started">
        {STEPS.map((step, index) => (
          <FadeIn key={step.step} delay={index * 0.12}>
            <li className="relative flex flex-col">
              {index < STEPS.length - 1 && (
                <div
                  className="absolute left-8 top-8 hidden h-px w-[calc(100%+2rem)] bg-border md:block"
                  aria-hidden
                />
              )}
              <span
                className="font-heading text-5xl font-extrabold text-wg-primary/15"
                aria-hidden
              >
                {step.step}
              </span>
              <h3 className="mt-2 font-heading text-xl font-bold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-foreground-secondary leading-relaxed">
                {step.description}
              </p>
            </li>
          </FadeIn>
        ))}
      </ol>
    </SectionContainer>
  );
}
