import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SkipLink } from "@/components/a11y/SkipLink";
import { WorkGraphLogo } from "@/components/brand/WorkGraphLogo";
import Footer from "@/components/layout/Footer";
import WorkGraphProviders from "@/components/providers/WorkGraphProviders";
import { Button } from "@/components/ui/button";
import { getPublishedGuidesForRole, listRolesWithPublishedGuides } from "@/lib/prep-pack/role-pages";
import { getPrepRoleById, PREP_ROLE_IDS } from "@/lib/prep-pack/roles";
import { routeShareMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ roleId: string }>;
};

export async function generateStaticParams() {
  // Prefer live coverage when possible; fall back to curated ids so build does not fail offline.
  const live = await listRolesWithPublishedGuides();
  if (live.length > 0) {
    return live.map(({ role }) => ({ roleId: role.id }));
  }
  return PREP_ROLE_IDS.map((roleId) => ({ roleId }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { roleId } = await params;
  const role = getPrepRoleById(roleId);
  if (!role) {
    return { title: "Role not found | WorkGraph", robots: { index: false, follow: false } };
  }

  const data = await getPublishedGuidesForRole(roleId);
  if (!data || data.guides.length === 0) {
    return {
      title: `${role.label} interview prep | WorkGraph`,
      robots: { index: false, follow: false },
    };
  }

  const title = `${role.label} interview prep | WorkGraph`;
  const description = `Published Interview Vault guides related to ${role.label}, plus a link to build a free prep pack. Estimates only — not a hiring probability.`;
  const share = routeShareMetadata(`/roles/${role.id}`);
  return {
    title,
    description,
    alternates: share.alternates,
    openGraph: {
      title,
      description,
      url: share.openGraph?.url,
    },
    twitter: {
      ...share.twitter,
      title,
      description,
    },
  };
}

export default async function RolePrepPage({ params }: PageProps) {
  const { roleId } = await params;
  if (!getPrepRoleById(roleId)) notFound();

  const data = await getPublishedGuidesForRole(roleId);
  if (!data || data.guides.length === 0) {
    // Thin/empty: noindex via metadata; render a clear empty state without inventing guides.
    return (
      <WorkGraphProviders>
        <div className="min-h-dvh bg-background">
          <SkipLink />
          <header className="border-b">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
              <Link href="/prep-pack" className="flex items-center gap-2">
                <WorkGraphLogo className="h-7 w-auto" />
                <span className="text-sm font-semibold">Prep pack</span>
              </Link>
            </div>
          </header>
          <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-12 outline-none">
            <h1 className="text-role-title">{getPrepRoleById(roleId)?.label} interview prep</h1>
            <p className="mt-3 text-role-body text-fg-secondary">
              No published Interview Vault guides match this role yet. This page is not indexed.
            </p>
            <Button asChild className="mt-6 min-h-11">
              <Link href="/prep-pack">Build a prep pack</Link>
            </Button>
          </main>
          <Footer />
        </div>
      </WorkGraphProviders>
    );
  }

  const { role, guides } = data;

  return (
    <WorkGraphProviders>
      <div className="min-h-dvh bg-background">
        <SkipLink />
        <header className="sticky top-0 z-modal border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
            <Link href={`/roles/${role.id}`} className="flex items-center gap-2">
              <WorkGraphLogo className="h-7 w-auto" />
              <span className="hidden text-sm font-semibold sm:inline">{role.label}</span>
            </Link>
            <nav className="flex items-center gap-1" aria-label="Role prep">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/prep-pack">Prep pack</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/interview-vault">Interview Vault</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/jobs">Jobs</Link>
              </Button>
            </nav>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="outline-none">
          <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
            <header className="space-y-3">
              <h1 className="text-role-title">{role.label} interview prep</h1>
              <p className="text-role-body text-fg-secondary">
                Published Interview Vault guides that mention this role family. Previews follow the existing
                entitlement model. Skill matches and checklists from a prep pack are estimates, not offer odds.
              </p>
              <Button asChild className="min-h-11">
                <Link href={`/prep-pack`}>Build a {role.label} prep pack</Link>
              </Button>
            </header>

            <section aria-labelledby="role-guides-heading" className="space-y-4">
              <h2 id="role-guides-heading" className="text-role-subheading">
                Published guides ({guides.length})
              </h2>
              <ul className="space-y-3" role="list">
                {guides.map((guide) => (
                  <li key={guide.id} className="rounded-control border border-hairline p-4">
                    <p className="text-role-body font-medium">
                      {guide.company} — {guide.role}
                    </p>
                    {guide.preview ? (
                      <p className="mt-2 text-role-caption text-fg-secondary">{guide.preview}</p>
                    ) : null}
                    <Button variant="outline" size="sm" className="mt-3 min-h-11" asChild>
                      <Link href={guide.href}>Open guide</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </WorkGraphProviders>
  );
}
