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
            className="border-b border-[#FECACA] bg-[#FFF5F5] px-4 py-2.5"
          >
            <div className="mx-auto flex max-w-[1280px] items-center justify-center gap-2 text-sm text-[#4A4A4A]">
              <span
                className="inline-block size-2 shrink-0 animate-pulse-soft rounded-full bg-[#C41E3A]"
                aria-hidden
              />
              <span>{NAV_ANNOUNCEMENT.message}</span>
              <Link
                href={NAV_ANNOUNCEMENT.href}
                className="font-semibold text-[#C41E3A] underline-offset-4 transition-colors hover:underline"
              >
                {NAV_ANNOUNCEMENT.cta}
              </Link>
              <button
                type="button"
                onClick={dismissAnnouncement}
                className="ml-2 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[#8A8A8A] transition-colors hover:bg-[#FECACA]/40 hover:text-[#0A0A0A]"
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
