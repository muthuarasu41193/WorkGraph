import {
  Brain,
  Kanban,
  Radar,
  Shield,
  TrendingUp,
  Vault,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FEATURES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { FadeIn } from "./FadeIn";
import { SectionContainer } from "./SectionContainer";

const ICONS: Record<(typeof FEATURES)[number]["icon"], LucideIcon> = {
  Radar,
  Brain,
  Vault,
  TrendingUp,
  Kanban,
  Shield,
};

const ACCENT_STYLES = {
  primary: "bg-wg-primary/10 text-wg-primary border-wg-primary/20",
  blue: "bg-wg-accent-blue/10 text-wg-accent-blue border-wg-accent-blue/20",
  success: "bg-wg-success/10 text-wg-success border-wg-success/20",
  warning: "bg-wg-warning/10 text-wg-warning border-wg-warning/20",
} as const;

export function FeaturesSection() {
  return (
    <SectionContainer id="features" ariaLabel="Features">
      <FadeIn className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-wg-primary">
          Platform features
        </p>
        <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Everything you need to win the hidden job market
        </h2>
        <p className="mt-4 text-lg text-foreground-secondary">
          One intelligence platform for discovery, preparation, and application — powered by AI.
        </p>
      </FadeIn>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => {
          const Icon = ICONS[feature.icon];
          const accent = ACCENT_STYLES[feature.accent as keyof typeof ACCENT_STYLES];

          return (
            <FadeIn key={feature.title} delay={index * 0.08}>
              <Card
                id={feature.title === "Interview Vault" ? "interview-vault" : undefined}
                className="h-full border-border bg-surface transition-all hover:border-wg-primary/20 hover:shadow-md"
              >
                <CardHeader>
                  <div
                    className={cn(
                      "mb-2 flex size-11 items-center justify-center rounded-xl border",
                      accent,
                    )}
                    aria-hidden
                  >
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="font-heading text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </FadeIn>
          );
        })}
      </div>
    </SectionContainer>
  );
}
