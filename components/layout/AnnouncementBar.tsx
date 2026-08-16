"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { NAV_ANNOUNCEMENT } from "@/lib/constants";
import { useLandingHeader } from "./LandingHeaderContext";

export default function AnnouncementBar() {
  const { announcementVisible, dismissAnnouncement } = useLandingHeader();

  return (
    <AnimatePresence initial={false}>
      {announcementVisible && (
        <motion.div
          key="announcement"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div
            role="region"
            aria-label="Announcement"
            className="border-b border-brand-200 bg-brand-50 px-4 py-2.5"
          >
            <div className="mx-auto flex max-w-[1280px] items-center justify-center gap-2 text-sm text-fg-secondary">
              <span
                className="inline-block size-2 shrink-0 animate-pulse-soft rounded-full bg-brand"
                aria-hidden
              />
              <span>{NAV_ANNOUNCEMENT.message}</span>
              <Link
                href={NAV_ANNOUNCEMENT.href}
                className="font-semibold text-brand underline-offset-4 transition-colors hover:underline"
              >
                {NAV_ANNOUNCEMENT.cta}
              </Link>
              <button
                type="button"
                onClick={dismissAnnouncement}
                className="ml-2 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-fg-tertiary transition-colors hover:bg-brand-200/40 hover:text-fg-primary"
                aria-label="Dismiss announcement"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
