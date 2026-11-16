import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SkipLink } from "@/components/a11y/SkipLink";
import { WorkGraphLogo } from "@/components/brand/WorkGraphLogo";
import Footer from "@/components/layout/Footer";
import WorkGraphProviders from "@/components/providers/WorkGraphProviders";
import { Button } from "@/components/ui/button";
import { publicShareOpenGraph } from "@/lib/prep-pack/share-public";
import { resolvePublicPrepPackShare } from "@/lib/prep-pack/share-server";
import { routeShareMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const pack = await resolvePublicPrepPackShare(token);
  if (!pack) {
    return {
      title: "Share link not found | WorkGraph",
      robots: { index: false, follow: false },
    };
  }
  const og = publicShareOpenGraph(pack);
  const share = routeShareMetadata(`/s/prep/${token}`);
  return {
    title: og.title,
    description: og.description,
    robots: { index: false, follow: false },
    alternates: share.alternates,
    openGraph: {
      title: og.title,
      description: og.description,
      url: share.openGraph?.url,
    },
    twitter: {
      ...share.twitter,
      title: og.title,
      description: og.description,
    },
  };
}

export default async function SharedPrepPackPage({ params }: PageProps) {
  const { token } = await params;
  const pack = await resolvePublicPrepPackShare(token);
  if (!pack) notFound();

  const roleLabel = pack.role.label?.trim() || "Interview prep";

  return (
    <WorkGraphProviders>
      <div className="min-h-dvh bg-background">
        <SkipLink />
        <header className="sticky top-0 z-modal border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
            <Link href="/prep-pack" className="flex items-center gap-2 shrink-0">
              <WorkGraphLogo className="h-7 w-auto" />
              <span className="hidden text-sm font-semibold sm:inline">Shared prep pack</span>
            </Link>
            <nav className="flex items-center gap-1" aria-label="Shared prep pack">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/prep-pack">Build your own</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/interview-vault">Interview Vault</Link>
              </Button>
            </nav>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="outline-none">
          <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
            <header className="space-y-2">
              <h1 className="text-role-title">Shared prep pack</h1>
              <p className="text-role-body text-fg-secondary">
                Role: <span className="text-fg-primary">{roleLabel}</span>
              </p>
              <p className="text-role-caption text-fg-secondary" role="note">
                {pack.estimateNotice}
              </p>
            </header>

            <section aria-labelledby="shared-skills-heading" className="space-y-3">
              <h2 id="shared-skills-heading" className="text-role-subheading">
                Skills (estimate)
              </h2>
              {pack.skills.length === 0 ? (
                <p className="text-role-body text-fg-secondary">No skills were included in this share.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {pack.skills.map((skill) => (
                    <li
                      key={`${skill.source}-${skill.name}`}
                      className="rounded-control border border-hairline px-3 py-1.5 text-role-caption"
                    >
                      {skill.name}
                      <span className="ml-2 text-fg-secondary">
                        {skill.source === "role_focus" ? "From role focus" : "From posting"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="shared-checklist-heading" className="space-y-3">
              <h2 id="shared-checklist-heading" className="text-role-subheading">
                Checklist
              </h2>
              {pack.checklist.length === 0 ? (
                <p className="text-role-body text-fg-secondary">No checklist items in this share.</p>
              ) : (
                <ul className="space-y-2">
                  {pack.checklist.map((item) => (
                    <li key={item.id} className="rounded-control border border-hairline p-3">
                      <p className="text-role-caption text-fg-secondary">{item.round}</p>
                      <p className="text-role-body">{item.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="shared-guides-heading" className="space-y-3">
              <h2 id="shared-guides-heading" className="text-role-subheading">
                Linked Interview Vault guides
              </h2>
              <p className="text-role-caption text-fg-secondary">
                Links open public guide pages. Locked content stays locked under the existing entitlement model.
                Milestone V1 evidence labels are not shown here because that milestone is not merged.
              </p>
              {pack.guides.length === 0 ? (
                <p className="text-role-body text-fg-secondary">No public guides were linked.</p>
              ) : (
                <ul className="space-y-3">
                  {pack.guides.map((guide) => (
                    <li key={guide.id} className="rounded-control border border-hairline p-4">
                      <p className="text-role-body font-medium">
                        {guide.company} — {guide.role}
                      </p>
                      {guide.why.length > 0 ? (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-role-caption text-fg-secondary">
                          {guide.why.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      ) : null}
                      <Button variant="outline" size="sm" className="mt-3 min-h-11" asChild>
                        <Link href={guide.href}>Open guide</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <p className="text-role-caption text-fg-secondary">
              This share does not include a raw job description or profile data. It will not get anyone a job offer.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    </WorkGraphProviders>
  );
}
