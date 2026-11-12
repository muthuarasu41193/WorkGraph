import type { Metadata } from "next";
import Link from "next/link";

import { SkipLink } from "@/components/a11y/SkipLink";
import { WorkGraphLogo } from "@/components/brand/WorkGraphLogo";
import Footer from "@/components/layout/Footer";
import WorkGraphProviders from "@/components/providers/WorkGraphProviders";
import { Button } from "@/components/ui/button";
import { routeShareMetadata } from "@/lib/seo";

const TITLE = "Interview prep pack | WorkGraph";
const DESCRIPTION =
  "Build a free, role-specific interview prep pack from a job description or role. Matching guides and a checklist. Estimates only.";
const share = routeShareMetadata("/prep-pack");

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: share.alternates,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: share.openGraph?.url,
  },
  twitter: {
    ...share.twitter,
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function PrepPackLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkGraphProviders>
      <div className="min-h-dvh bg-background">
        <SkipLink />
        <header className="sticky top-0 z-modal border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
            <Link href="/prep-pack" className="flex items-center gap-2 shrink-0">
              <WorkGraphLogo className="h-7 w-auto" />
              <span className="hidden text-sm font-semibold sm:inline">Prep pack</span>
            </Link>
            <nav className="flex items-center gap-1" aria-label="Prep pack">
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
          {children}
        </main>
        <Footer />
      </div>
    </WorkGraphProviders>
  );
}
