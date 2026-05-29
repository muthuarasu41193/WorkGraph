"use client";

import Link from "next/link";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import SignOutButton from "./SignOutButton";
import ProfileThemeToggle from "./theme/ProfileThemeToggle";
import { emitProfileSaveStart, emitSaveAllBegin, emitSaveAllRequested } from "../../lib/profile-save-events";

type Props = {
  profileName?: string | null;
};

export default function ProfileTopBar({ profileName }: Props) {
  return (
    <header className="wg-profile-nav sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/legacy"
            className="flex shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-primary-foreground">
              WG
            </span>
            <span className="hidden text-sm font-bold tracking-tight text-foreground sm:inline">
              WorkGraph
            </span>
          </Link>
          <Separator orientation="vertical" className="hidden h-4 md:block" />
          <p className="hidden truncate text-sm font-medium text-muted-foreground md:block">
            {profileName || "Your profile"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ProfileThemeToggle />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              emitSaveAllBegin(["header", "links", "skills", "experience", "education"]);
              emitProfileSaveStart("all sections");
              emitSaveAllRequested();
            }}
          >
            <Save className="h-3.5 w-3.5" aria-hidden />
            Save all
          </Button>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
