import { accountDataRights } from "@/lib/account/privacy-copy";
import { LandingPage } from "@/src/components/landing/LandingPage";

export const dynamic = "force-dynamic";

/**
 * Live homepage — Stateweave-inspired WorkGraph landing.
 * Uses its own nav/footer; intentionally outside `(marketing)` chrome.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const accountDeleted = raw.accountDeleted === "1";

  return (
    <LandingPage
      accountDeletedBanner={
        accountDeleted ? accountDataRights().deletedBanner : null
      }
    />
  );
}
