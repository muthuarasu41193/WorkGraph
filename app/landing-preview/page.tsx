import { LandingPage } from "@/src/components/landing/LandingPage";

export const dynamic = "force-dynamic";

/**
 * Isolated redesign preview at `/landing-preview`.
 * Does not replace the live marketing homepage.
 */
export default function LandingPreviewPage() {
  return <LandingPage />;
}
