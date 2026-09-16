/* LEGAL REVIEW REQUIRED — DO NOT SHIP WITHOUT COUNSEL SIGN-OFF. */

import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, LegalTable } from "@/components/legal/LegalDocument";
import { LEGAL_LAST_UPDATED, LEGAL_VERSION, PRIVACY_EMAIL } from "@/lib/legal";
import { routeShareMetadata } from "@/lib/seo";

const TITLE = "Cookie Policy";
const DESCRIPTION = "Cookies and similar storage WorkGraph uses, why, and how to change your choice.";
const share = routeShareMetadata("/legal/cookies");

export const metadata: Metadata = {
  title: `${TITLE} | WorkGraph`,
  description: DESCRIPTION,
  alternates: share.alternates,
  openGraph: { title: `${TITLE} | WorkGraph`, description: DESCRIPTION, url: share.openGraph?.url },
  twitter: { ...share.twitter, title: `${TITLE} | WorkGraph`, description: DESCRIPTION },
};

export default function CookiePolicyPage() {
  return (
    <LegalDocument
      title={TITLE}
      version={LEGAL_VERSION}
      lastUpdated={LEGAL_LAST_UPDATED}
      intro={
        <p>
          This draft explains cookies and local storage on getworkgraph.com. It should be read with
          the{" "}
          <Link className="text-brand underline-offset-4 hover:underline" href="/legal/privacy">
            Privacy Policy
          </Link>
          .
        </p>
      }
      sections={[
        {
          id: "what-we-store",
          title: "What we store on your device",
          content: (
            <>
              <LegalTable
                headers={["Name / type", "Category", "Purpose", "Duration"]}
                rows={[
                  [
                    "Authentication cookies (Supabase or equivalent)",
                    "Strictly necessary",
                    "Keep you signed in and protect account sessions",
                    "Session / refresh period set by the auth provider",
                  ],
                  [
                    "wg-cookie-consent (local storage)",
                    "Strictly necessary",
                    "Remember whether you accepted or declined the cookie banner",
                    "Until you clear site data",
                  ],
                  [
                    "Theme / UI preferences (if set)",
                    "Functional",
                    "Remember dark/light or dashboard layout choices",
                    "Until you clear site data",
                  ],
                ]}
              />
              <p>
                As of this draft we do not drop third-party advertising cookies. If we add analytics
                that is not strictly necessary, we will list those cookies here and only set them
                after consent where the law requires it.
              </p>
            </>
          ),
        },
        {
          id: "how-to-choose",
          title: "How to change your choice",
          content: (
            <ul className="list-disc space-y-2 pl-5">
              <li>Use Accept or Decline on the cookie banner the first time you visit.</li>
              <li>Clear this site&apos;s cookies and local storage in your browser to see the banner again.</li>
              <li>
                Browser controls can block cookies entirely; some features (sign-in) will not work
                without strictly necessary cookies.
              </li>
            </ul>
          ),
        },
        {
          id: "device-analytics",
          title: "Device and analytics data",
          content: (
            <p>
              Independent of cookies, our hosting provider (Vercel) and application logs may record
              IP address, user-agent, and requested URL for security and reliability. That
              processing is described under &quot;Device / analytics&quot; in the Privacy Policy. We do
              not sell this information.
            </p>
          ),
        },
        {
          id: "contact",
          title: "Questions",
          content: (
            <p>
              Cookie questions:{" "}
              <a className="text-brand underline-offset-4 hover:underline" href={`mailto:${PRIVACY_EMAIL}`}>
                {PRIVACY_EMAIL}
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
