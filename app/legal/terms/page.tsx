/* LEGAL REVIEW REQUIRED — DO NOT SHIP WITHOUT COUNSEL SIGN-OFF. */

import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL_LAST_UPDATED, LEGAL_VERSION, PRIVACY_EMAIL } from "@/lib/legal";
import { routeShareMetadata } from "@/lib/seo";

const TITLE = "Terms of Service";
const DESCRIPTION = "Rules for using WorkGraph, including accounts, the Interview Vault, and acceptable use.";
const share = routeShareMetadata("/legal/terms");

export const metadata: Metadata = {
  title: `${TITLE} | WorkGraph`,
  description: DESCRIPTION,
  alternates: share.alternates,
  openGraph: { title: `${TITLE} | WorkGraph`, description: DESCRIPTION, url: share.openGraph?.url },
  twitter: { ...share.twitter, title: `${TITLE} | WorkGraph`, description: DESCRIPTION },
};

export default function TermsOfServicePage() {
  return (
    <LegalDocument
      title={TITLE}
      version={LEGAL_VERSION}
      lastUpdated={LEGAL_LAST_UPDATED}
      intro={
        <p>
          These draft terms govern access to WorkGraph. They are a placeholder for counsel and are
          not an offer. By creating an account you will be asked to agree to the version then in
          force. Related:{" "}
          <Link className="text-brand underline-offset-4 hover:underline" href="/legal/privacy">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link className="text-brand underline-offset-4 hover:underline" href="/legal/acceptable-use">
            Acceptable Use
          </Link>
          .
        </p>
      }
      sections={[
        {
          id: "the-service",
          title: "The service",
          content: (
            <p>
              WorkGraph helps jobseekers discover listings, organize applications, score a resume
              against a job description, and buy or sell interview guides. Career scores and match
              percentages are estimates, not guarantees of interviews or offers. We may change or
              discontinue features with reasonable notice where the change is material.
            </p>
          ),
        },
        {
          id: "accounts",
          title: "Accounts",
          content: (
            <p>
              You must provide accurate registration details and keep credentials confidential. You
              are responsible for activity under your account. We may suspend an account that
              violates these terms or the Acceptable Use Policy, or that presents a security risk.
              You can request deletion as described in the Privacy Policy.
            </p>
          ),
        },
        {
          id: "your-content",
          title: "Your content",
          content: (
            <p>
              You retain rights in resumes, profile text, and interview guides you upload. You grant
              WorkGraph a limited licence to host, parse, display, and process that content solely
              to provide the features you use (including sending resume-derived text to listed AI
              subprocessors). Marketplace guides you publish may be shown to other signed-in users
              who purchase or preview them.
            </p>
          ),
        },
        {
          id: "interview-vault",
          title: "Interview Vault marketplace",
          content: (
            <p>
              Paid vault transactions, when enabled, are processed by Stripe. Payouts, refunds, and
              revenue share will be described in-product at checkout. Guides must be your own
              experience; do not post confidential employer materials you are not allowed to share.
              We may remove listings that appear fraudulent or that violate Acceptable Use.
            </p>
          ),
        },
        {
          id: "acceptable-use",
          title: "Acceptable use",
          content: (
            <p>
              You must follow the{" "}
              <Link className="text-brand underline-offset-4 hover:underline" href="/legal/acceptable-use">
                Acceptable Use Policy
              </Link>
              . Scraping, account sharing, uploading others&apos; resumes without authority, or using
              the service to discriminate in hiring is prohibited.
            </p>
          ),
        },
        {
          id: "disclaimers",
          title: "Disclaimers and limitation of liability",
          content: (
            <p>
              Draft placeholder: the service is provided &quot;as is.&quot; We do not warrant that a
              listing is still open, that a match score predicts hiring, or that third-party job
              sources are complete. Counsel will insert the liability cap, consumer-law savings
              language, and governing law for the jurisdictions we serve.
            </p>
          ),
        },
        {
          id: "termination",
          title: "Termination",
          content: (
            <p>
              You may stop using WorkGraph and request account deletion at any time. We may
              terminate or suspend access for breach, unpaid fees, or legal risk. Upon termination
              we delete or anonymize personal data as described in the Privacy Policy, except where
              we must retain records (for example a pending payment dispute).
            </p>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          content: (
            <p>
              Legal notices: {PRIVACY_EMAIL} (privacy) or contact@getworkgraph.com. This draft does
              not specify a governing-law or venue clause until counsel signs off.
            </p>
          ),
        },
      ]}
    />
  );
}
