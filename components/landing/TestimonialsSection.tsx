import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TESTIMONIALS } from "@/lib/constants";
import { FadeIn } from "./FadeIn";
import { SectionContainer } from "./SectionContainer";

export function TestimonialsSection() {
  return (
    <SectionContainer id="testimonials" ariaLabel="Testimonials" className="bg-surface-2">
      <FadeIn className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-wg-primary">
          Testimonials
        </p>
        <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Trusted by ambitious professionals
        </h2>
      </FadeIn>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((item, index) => (
          <FadeIn key={item.author} delay={index * 0.1}>
            <Card className="h-full border-border bg-surface">
              <CardContent className="flex h-full flex-col pt-6">
                <Quote className="size-8 text-wg-primary/30" aria-hidden />
                <blockquote className="mt-4 flex-1 text-foreground-secondary leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <footer className="mt-6 border-t border-border pt-4">
                  <cite className="not-italic">
                    <p className="font-semibold text-foreground">{item.author}</p>
                    <p className="text-sm text-foreground-muted">
                      {item.role} · {item.company}
                    </p>
                  </cite>
                </footer>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>
    </SectionContainer>
  );
}
