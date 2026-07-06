import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Building2, ExternalLink, MapPin, Radio } from "lucide-react";
import {
  AppShell,
  AppShellBody,
  AppShellContent,
  AppShellHeader,
  AppShellMain,
  AppShellPage,
  AppShellPageHeader,
} from "@/components/layout/AppShell";
import { WorkGraphLogo } from "@/components/brand/WorkGraphLogo";
import { getPublicCompanyBySlug } from "@/lib/employer/public-company";
import {
  HIRING_INTENT_LABELS,
  VERIFICATION_STATUS_LABELS,
  WORK_MODE_LABELS,
} from "@/lib/employer/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const data = await getPublicCompanyBySlug(slug);
  if (!data) return { title: "Company — WorkGraph" };
  return {
    title: `${data.profile.company_name} — Hiring on WorkGraph`,
    description: data.profile.tagline ?? `Live hiring signals from ${data.profile.company_name}`,
  };
}

export default async function PublicCompanyPage({ params }: Props) {
  const { slug } = await params;
  const data = await getPublicCompanyBySlug(slug);
  if (!data) notFound();

  const { profile, signals } = data;

  return (
    <AppShell className="bg-background">
      <AppShellHeader className="border-b">
        <div className="mx-auto flex h-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/">
            <WorkGraphLogo />
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile?view=workgraph-direct">WorkGraph Direct</Link>
          </Button>
        </div>
      </AppShellHeader>

      <AppShellBody>
        <AppShellMain className="mx-auto max-w-3xl">
          <AppShellPage>
            <AppShellPageHeader padding={false}>
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                  <Building2 className="h-7 w-7 text-muted-foreground" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-heading-l">{profile.company_name}</h1>
                    {profile.verification_status === "verified" ? (
                      <Badge className="gap-1 bg-success hover:bg-success">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        {VERIFICATION_STATUS_LABELS.verified}
                      </Badge>
                    ) : null}
                  </div>
                  {profile.tagline ? (
                    <p className="mt-1 text-muted-foreground">{profile.tagline}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-3 text-body text-muted-foreground">
                    {profile.team_size ? <span>{profile.team_size} team</span> : null}
                    {profile.website_url ? (
                      <a
                        href={
                          profile.website_url.startsWith("http")
                            ? profile.website_url
                            : `https://${profile.website_url}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline"
                      >
                        Website
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </AppShellPageHeader>

            <AppShellContent constrained={false} className="space-y-10 py-10">
              {profile.hiring_philosophy ? (
                <section className="rounded-xl border bg-muted/30 p-5">
                  <h2 className="text-body font-semibold">Hiring philosophy</h2>
                  <p className="mt-2 whitespace-pre-wrap text-body text-muted-foreground">
                    {profile.hiring_philosophy}
                  </p>
                </section>
              ) : null}

              <section className="space-y-4">
                <h2 className="flex items-center gap-2 text-heading-s">
                  <Radio className="h-5 w-5 text-[var(--accent)]" />
                  Live hiring signals
                </h2>
                {signals.length === 0 ? (
                  <p className="text-body text-muted-foreground">No live signals right now.</p>
                ) : (
                  <ul className="space-y-4">
                    {signals.map((signal) => (
                      <li key={signal.id}>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-body-lg">{signal.title}</CardTitle>
                            <div className="flex flex-wrap gap-2 text-caption text-muted-foreground">
                              {signal.location ? (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {signal.location}
                                </span>
                              ) : null}
                              <span>{WORK_MODE_LABELS[signal.work_mode]}</span>
                              <span>{HIRING_INTENT_LABELS[signal.hiring_intent]}</span>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 text-body">
                            {signal.why_now ? (
                              <p className="border-l-2 border-[var(--accent)] pl-3 italic text-foreground/90">
                                {signal.why_now}
                              </p>
                            ) : null}
                            {signal.fit_signals.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {signal.fit_signals.map((f) => (
                                  <Badge key={f.label} variant="secondary" className="text-caption">
                                    {f.label}
                                  </Badge>
                                ))}
                              </div>
                            ) : null}
                            <Button size="sm" asChild>
                              <Link href="/profile?view=workgraph-direct">Connect on WorkGraph</Link>
                            </Button>
                          </CardContent>
                        </Card>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <p className="text-center text-caption text-muted-foreground">
                Employers post signals on WorkGraph Direct — not scraped ATS listings.
              </p>
            </AppShellContent>
          </AppShellPage>
        </AppShellMain>
      </AppShellBody>
    </AppShell>
  );
}
