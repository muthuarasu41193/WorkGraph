"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "wg-announcement-dismissed";
const ANNOUNCEMENT_HEIGHT = 44;
const NAV_HEIGHT = 64;

type LandingHeaderContextValue = {
  announcementVisible: boolean;
  dismissAnnouncement: () => void;
  headerOffset: number;
  navHeight: number;
};

const LandingHeaderContext = createContext<LandingHeaderContextValue | null>(null);

export function LandingHeaderProvider({ children }: { children: ReactNode }) {
  const [announcementVisible, setAnnouncementVisible] = useState(false);

  useEffect(() => {
    setAnnouncementVisible(localStorage.getItem(STORAGE_KEY) !== "true");
  }, []);

  const dismissAnnouncement = useCallback(() => {
    setAnnouncementVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const headerOffset = NAV_HEIGHT + (announcementVisible ? ANNOUNCEMENT_HEIGHT : 0);

  const value = useMemo(
    () => ({
      announcementVisible,
      dismissAnnouncement,
      headerOffset,
      navHeight: NAV_HEIGHT,
    }),
    [announcementVisible, dismissAnnouncement, headerOffset],
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
