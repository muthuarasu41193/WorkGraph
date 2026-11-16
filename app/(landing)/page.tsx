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
    <>
      {accountDeleted ? (
        <div
          className="wg-account-deleted"
          role="status"
          style={{
            maxWidth: "1120px",
            margin: "0.75rem auto 0",
            padding: "0 1rem",
          }}
        >
          <p
            style={{
              margin: 0,
              padding: "0.85rem 1rem",
              borderRadius: "0.65rem",
              border: "1px solid #c5ccd6",
              background: "#fff",
              color: "#14181f",
              fontFamily: "inherit",
            }}
          >
            {accountDataRights().deletedBanner}
          </p>
        </div>
      ) : null}
      <LandingPage />
    </>
  );
}
