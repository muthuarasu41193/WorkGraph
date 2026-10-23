"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { NAV_ANNOUNCEMENT } from "@/lib/constants";
import { displayCount } from "@/lib/social-proof";
import { useLandingHeader } from "./LandingHeaderContext";

export default function AnnouncementBar({ signups = 0 }: { signups?: number }) {
  const { announcementVisible, dismissAnnouncement } = useLandingHeader();
  const joined = displayCount(signups);
  const message = joined.showNumber
    ? `Early access · ${joined.display} people have joined`
    : joined.display;

  if (!announcementVisible) return null;

  return (
    <div
      role="region"
      aria-label="Announcement"
      className="border-b border-brand-200 bg-brand-50 px-4 py-2.5"
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-center gap-2 text-sm text-fg-secondary">
        <span>{message}</span>
        <Link
          href={NAV_ANNOUNCEMENT.href}
          className="font-semibold text-brand underline-offset-4 transition-colors duration-base hover:underline"
        >
          {NAV_ANNOUNCEMENT.cta}
        </Link>
        <button
          type="button"
          onClick={dismissAnnouncement}
          className="ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-fg-tertiary transition-colors duration-base hover:bg-brand-200/40 hover:text-fg-primary"
          aria-label="Dismiss announcement"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
