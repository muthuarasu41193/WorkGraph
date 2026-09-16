/* LEGAL REVIEW REQUIRED — DO NOT SHIP WITHOUT COUNSEL SIGN-OFF. */

import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL_LAST_UPDATED, LEGAL_VERSION, PRIVACY_EMAIL } from "@/lib/legal";
import { routeShareMetadata } from "@/lib/seo";

const TITLE = "Acceptable Use Policy";
const DESCRIPTION = "What you may and may not do on WorkGraph, including resumes, scraping, and the Interview Vault.";
const share = routeShareMetadata("/legal/acceptable-use");

export const metadata: Metadata = {
  title: `${TITLE} | WorkGraph`,
  description: DESCRIPTION,
  alternates: share.alternates,
  openGraph: { title: `${TITLE} | WorkGraph`, description: DESCRIPTION, url: share.openGraph?.url },
  twitter: { ...share.twitter, title: `${TITLE} | WorkGraph`, description: DESCRIPTION },
};

export default function AcceptableUsePage() {
  return (
    <LegalDocument
      title={TITLE}
      version={LEGAL_VERSION}
      lastUpdated={LEGAL_LAST_UPDATED}
      intro={
        <p>
          This policy is part of the{" "}
          <Link className="text-brand underline-offset-4 hover:underline" href="/legal/terms">
            Terms of Service
          </Link>
          . We may suspend accounts that violate it.
        </p>
      }
      sections={[
        {
          id: "allowed",
          title: "Intended use",
          content: (
            <p>
              Use WorkGraph to manage your own job search, publish interview experiences you
              actually had, or (if you are an employer customer) post hiring signals for roles you
              are authorized to recruit for.
            </p>
          ),
        },
        {
          id: "prohibited",
          title: "Prohibited conduct",
          content: (
            <ul className="list-disc space-y-2 pl-5">
              <li>Uploading another person&apos;s resume or personal data without a lawful basis and their knowledge.</li>
              <li>Scraping, bulk harvesting, or circumventing rate limits, paywalls, or access controls.</li>
              <li>Attempting to probe, reverse engineer, or overload the service or its subprocessors.</li>
              <li>Publishing fabricated interview guides, leaked take-home exams, or confidential employer materials you are not allowed to share.</li>
              <li>Using match scores, Talent Intelligence, or vault content to make automated hiring decisions that unlawfully discriminate, or to infer protected characteristics.</li>
              <li>Misrepresenting that a WorkGraph score is a hiring probability or an endorsement by an employer.</li>
              <li>Sending spam, phishing, or malware through any messaging or email feature.</li>
            </ul>
          ),
        },
        {
          id: "enforcement",
          title: "Enforcement",
          content: (
            <p>
              We may remove content, rate-limit, suspend, or terminate accounts, and we may preserve
              logs needed to investigate abuse. Report violations to {PRIVACY_EMAIL} or
              support@getworkgraph.com.
            </p>
          ),
        },
      ]}
    />
  );
}
