import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EARLY_STAGE_COPY, teamMemberDisclosure, type TestimonialRow } from "@/lib/social-proof";
import { FadeIn } from "./FadeIn";
import { SectionContainer } from "./SectionContainer";

export function TestimonialsSection({ items = [] }: { items?: TestimonialRow[] }) {
  const consented = items.filter((row) => row.consent_given_at);

  return (
    <SectionContainer id="testimonials" ariaLabel="Testimonials" className="bg-surface-2">
      <FadeIn className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-wg-primary">
          Testimonials
        </p>
        <h2 className="wg-section-heading mt-3 font-heading font-bold tracking-tight text-foreground">
          {consented.length > 0 ? "From people who consented to share" : EARLY_STAGE_COPY}
        </h2>
      </FadeIn>

      {consented.length > 0 ? (
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {consented.map((item, index) => {
            const disclosure = teamMemberDisclosure(item.is_employee);
            return (
              <FadeIn key={item.id} delay={index * 0.1}>
                <Card className="h-full border-border bg-surface">
                  <CardContent className="flex h-full flex-col pt-6">
                    <Quote className="size-8 text-wg-primary/30" aria-hidden />
                    <blockquote className="mt-4 flex-1 text-foreground-secondary leading-relaxed">
                      &ldquo;{item.quote}&rdquo;
                    </blockquote>
                    <footer className="mt-6 border-t border-border pt-4">
                      <cite className="not-italic">
                        <p className="font-semibold text-foreground">{item.author_name}</p>
                        {item.author_title ? (
                          <p className="text-sm text-foreground-muted">{item.author_title}</p>
                        ) : null}
                        {disclosure ? (
                          <p className="mt-1 text-xs font-semibold text-wg-primary">{disclosure}</p>
                        ) : null}
                      </cite>
                    </footer>
                  </CardContent>
                </Card>
              </FadeIn>
            );
          })}
        </div>
      ) : (
        <p className="mx-auto mt-10 max-w-xl text-center text-foreground-secondary">
          When someone consents to a public quote, it will show up here. We do not publish
          placeholder reviews.
        </p>
      )}
    </SectionContainer>
  );
}
