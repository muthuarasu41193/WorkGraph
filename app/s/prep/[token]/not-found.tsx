import Link from "next/link";

import { SkipLink } from "@/components/a11y/SkipLink";
import { WorkGraphLogo } from "@/components/brand/WorkGraphLogo";
import WorkGraphProviders from "@/components/providers/WorkGraphProviders";
import { Button } from "@/components/ui/button";

export default function SharedPrepPackNotFound() {
  return (
    <WorkGraphProviders>
      <div className="min-h-dvh bg-background">
        <SkipLink />
        <header className="border-b">
          <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
            <Link href="/prep-pack" className="flex items-center gap-2">
              <WorkGraphLogo className="h-7 w-auto" />
              <span className="text-sm font-semibold">Prep pack</span>
            </Link>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="mx-auto max-w-lg px-4 py-16 outline-none">
          <h1 className="text-role-title">Share link not found</h1>
          <p className="mt-3 text-role-body text-fg-secondary">
            This share link is missing, expired, or was revoked by its owner. Nothing private is shown.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="min-h-11">
              <Link href="/prep-pack">Build a prep pack</Link>
            </Button>
            <Button variant="outline" asChild className="min-h-11">
              <Link href="/interview-vault">Browse Interview Vault</Link>
            </Button>
          </div>
        </main>
      </div>
    </WorkGraphProviders>
  );
}
