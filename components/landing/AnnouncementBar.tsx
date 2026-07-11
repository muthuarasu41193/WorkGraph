import Link from "next/link";
import { ANNOUNCEMENT } from "@/lib/constants";

export function AnnouncementBar() {
  return (
    <div
      role="region"
      aria-label="Announcement"
      className="border-b border-border bg-surface-2 px-4 py-2.5 text-center text-sm text-foreground-secondary"
    >
      <div className="mx-auto flex max-w-landing flex-wrap items-center justify-center gap-2">
        <span
          className="inline-block size-2 animate-pulse-soft rounded-full bg-success"
          aria-hidden
        />
        <span>{ANNOUNCEMENT.message}</span>
        <Link
          href={ANNOUNCEMENT.href}
          className="font-semibold text-foreground underline-offset-4 hover:text-wg-primary hover:underline"
        >
          {ANNOUNCEMENT.cta} →
        </Link>
      </div>
    </div>
  );
}
