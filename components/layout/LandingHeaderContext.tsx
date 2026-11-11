"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

const ANNOUNCEMENT_HEIGHT = 0;
const NAV_HEIGHT = 64;

type LandingHeaderContextValue = {
  announcementVisible: boolean;
  dismissAnnouncement: () => void;
  headerOffset: number;
  navHeight: number;
};

const LandingHeaderContext = createContext<LandingHeaderContextValue | null>(null);

export function LandingHeaderProvider({ children }: { children: ReactNode }) {
  const dismissAnnouncement = useCallback(() => {
    // Waitlist invitation lives in the header as a quiet link; no banner to dismiss.
  }, []);

  const value = useMemo(
    () => ({
      announcementVisible: false,
      dismissAnnouncement,
      headerOffset: NAV_HEIGHT,
      navHeight: NAV_HEIGHT,
    }),
    [dismissAnnouncement],
  );

  return (
    <LandingHeaderContext.Provider value={value}>{children}</LandingHeaderContext.Provider>
  );
}

export function useLandingHeader() {
  const ctx = useContext(LandingHeaderContext);
  if (!ctx) {
    throw new Error("useLandingHeader must be used within LandingHeaderProvider");
  }
  return ctx;
}

export { ANNOUNCEMENT_HEIGHT, NAV_HEIGHT };
