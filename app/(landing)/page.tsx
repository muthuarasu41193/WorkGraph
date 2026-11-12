import { LandingPage } from "@/src/components/landing/LandingPage";

export const dynamic = "force-dynamic";

/**
 * Live homepage — Stiro-inspired WorkGraph landing.
 * Uses its own nav/footer; intentionally outside `(marketing)` chrome.
 */
export default function HomePage() {
  return <LandingPage />;
}
