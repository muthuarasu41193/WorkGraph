"use client";

import Link from "next/link";
import { Save } from "lucide-react";
import SignOutButton from "./SignOutButton";
import ProfileThemeToggle from "./theme/ProfileThemeToggle";
import { emitProfileSaveStart, emitSaveAllBegin, emitSaveAllRequested } from "../../lib/profile-save-events";

export default function ProfileTopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--wg-color-border)] bg-[var(--wg-color-surface)]/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--wg-color-primary)]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--wg-color-primary)]/10 ring-1 ring-[var(--wg-color-border)]">
            <span className="h-3.5 w-3.5 rounded-sm bg-[var(--wg-color-primary)]" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[var(--wg-color-text-primary)] group-hover:text-[var(--wg-color-primary)]">
            WorkGraph
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ProfileThemeToggle />
          <button
            type="button"
            onClick={() => {
              emitSaveAllBegin(["header", "links", "skills", "experience", "education"]);
              emitProfileSaveStart("all sections");
              emitSaveAllRequested();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--wg-color-border)] bg-[var(--wg-color-surface-variant)] px-3 py-2 text-xs font-medium text-[var(--wg-color-text-primary)] transition hover:shadow-sm"
          >
            <Save className="h-3.5 w-3.5" aria-hidden />
            Save all
          </button>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
