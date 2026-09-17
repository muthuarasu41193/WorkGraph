/* LEGAL REVIEW REQUIRED — DO NOT SHIP WITHOUT COUNSEL SIGN-OFF. */

import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, LegalTable } from "@/components/legal/LegalDocument";
import {
  DATA_CATEGORIES,
  LEGAL_LAST_UPDATED,
  LEGAL_VERSION,
  PRIVACY_EMAIL,
  SUBPROCESSORS,
} from "@/lib/legal";
import { routeShareMetadata } from "@/lib/seo";

const TITLE = "Privacy Policy";
const DESCRIPTION =
  "How WorkGraph collects, uses, stores, and shares personal data, including resume content and automated matching.";
const share = routeShareMetadata("/legal/privacy");

export const metadata: Metadata = {
  title: `${TITLE} | WorkGraph`,
  description: DESCRIPTION,
  alternates: share.alternates,
  openGraph: { title: `${TITLE} | WorkGraph`, description: DESCRIPTION, url: share.openGraph?.url },
  twitter: { ...share.twitter, title: `${TITLE} | WorkGraph`, description: DESCRIPTION },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      title={TITLE}
      version={LEGAL_VERSION}
      lastUpdated={LEGAL_LAST_UPDATED}
      intro={
        <>
          <p>
            This draft describes how WorkGraph (&quot;we&quot;, &quot;us&quot;) processes personal data when you
            use getworkgraph.com and related apps. It is a working placeholder for counsel, not a
            signed-off policy.
          </p>
          <p>
            Privacy requests:{" "}
            <a className="text-brand underline-offset-4 hover:underline" href={`mailto:${PRIVACY_EMAIL}`}>
              {PRIVACY_EMAIL}
            </a>
            . Related documents:{" "}
            <Link className="text-brand underline-offset-4 hover:underline" href="/legal/cookies">
              Cookie Policy
            </Link>
            ,{" "}
            <Link className="text-brand underline-offset-4 hover:underline" href="/legal/terms">
              Terms
            </Link>
            , and{" "}
            <Link className="text-brand underline-offset-4 hover:underline" href="/legal/dpa">
              DPA
            </Link>
            .
          </p>
        </>
      }
      sections={[
        {
          id: "who-we-are",
          title: "Who we are",
          content: (
            <>
              <p>
                WorkGraph is a job-intelligence product operated from the public site at
                getworkgraph.com. For most jobseeker accounts we act as a <strong>controller</strong> of
                the personal data you submit. When an employer customer asks us to process candidate
                data on their instructions, we act as a <strong>processor</strong> under the{" "}
                <Link className="text-brand underline-offset-4 hover:underline" href="/legal/dpa">
                  Data Processing Addendum
                </Link>
                .
              </p>
            </>
          ),
        },
        {
          id: "data-we-collect",
          title: "Categories of personal data collected",
          content: (
            <>
              <p>We collect the following categories. We do not require you to provide special-category data (for example health, religion, or trade-union membership) and our matching features are not designed to infer protected characteristics.</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Account:</strong> name, email address, authentication identifiers, and
                  optional contact details you add to your profile.
                </li>
                <li>
                  <strong>Resume content:</strong> files you upload, extracted text, skills, work
                  history, education, and links (LinkedIn, GitHub, portfolio).
                </li>
                <li>
                  <strong>Application activity:</strong> saved and tracked jobs, Interview Vault
                  listings you publish or buy, employer hiring-signal connections, and notes you
                  store in the product.
                </li>
                <li>
                  <strong>Device / analytics:</strong> cookie consent stored in your browser, IP and
                  user-agent on security-relevant requests, and coarse usage needed to keep the
                  service running. We do not run a third-party advertising pixel as of this draft.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "purpose-and-lawful-basis",
          title: "Purpose and lawful basis",
          content: (
            <>
              <p>
                The table below is the draft mapping we will ask counsel to confirm. Labels such as
                &quot;contract&quot; and &quot;legitimate interests&quot; refer to GDPR Article 6 where it applies.
              </p>
              <LegalTable
                headers={["Category", "Purpose", "Lawful basis"]}
                rows={DATA_CATEGORIES.map((row) => [row.category, row.purpose, row.lawfulBasis])}
              />
            </>
          ),
        },
        {
          id: "subprocessors",
          title: "Named subprocessors",
          content: (
            <>
              <p>
                We use the following providers to operate WorkGraph. Resume files and profile text
                stay in our controlled stores except where a listed AI or hosting provider must
                process them to run a feature you use.
              </p>
              <LegalTable
                headers={["Provider", "Function", "Hosting region"]}
                rows={SUBPROCESSORS.map((row) => [row.name, row.function, row.region])}
              />
            </>
          ),
        },
        {
          id: "international-transfers",
          title: "International transfer mechanism",
          content: (
            <>
              <p>
                WorkGraph is hosted with providers that store or process data in the United States.
                If you access the service from the EEA, UK, or Switzerland, that is an international
                transfer.
              </p>
              <p>
                Draft mechanism: where required, we rely on the European Commission&apos;s Standard
                Contractual Clauses (and the UK International Data Transfer Addendum) with
                subprocessors, plus the security measures described in the DPA. This clause will be
                replaced with the instruments counsel selects (SCCs, adequacy, DPF certification, or
                otherwise).
              </p>
            </>
          ),
        },
        {
          id: "retention",
          title: "Retention periods per data category",
          content: (
            <>
              <p>
                Production systems follow the periods below. Encrypted backups typically rotate out
                within 30 days after deletion unless a legal hold applies.
              </p>
              <LegalTable
                headers={["Category", "Retention period"]}
                rows={DATA_CATEGORIES.map((row) => [row.category, row.retention])}
              />
            </>
          ),
        },
        {
          id: "your-rights",
          title: "Data subject rights and how to exercise them",
          content: (
            <>
              <p>
                Depending on where you live, you may have rights to access, correct, delete, export
                (portability), restrict, or object to certain processing, and to withdraw consent.
              </p>
              <p>How to exercise them:</p>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Use in-product controls where they exist (profile edit, resume delete, application
                  tracker delete, account deletion in settings).
                </li>
                <li>
                  Email{" "}
                  <a className="text-brand underline-offset-4 hover:underline" href={`mailto:${PRIVACY_EMAIL}`}>
                    {PRIVACY_EMAIL}
                  </a>{" "}
                  from the address on your account. State the right you want to exercise and enough
                  detail for us to locate your data. We will not ask you to paste a full resume in
                  that email if a less sensitive identifier will do.
                </li>
                <li>
                  We aim to respond within 30 days (or the statutory period that applies). We may
                  need to verify that the request comes from the account holder.
                </li>
              </ol>
              <p>
                You may also lodge a complaint with your local supervisory authority. We will name
                our lead authority here after counsel review.
              </p>
            </>
          ),
        },
        {
          id: "automated-matching",
          title: "How automated matching works and your right to object",
          content: (
            <>
              <p>
                WorkGraph scores how a job listing compares to skills and experience extracted from
                your profile or resume. Scores are <strong>estimates</strong>, not hiring
                probabilities, and they are not used to make a legal or similarly significant
                decision about you without a human (we are not an employer).
              </p>
              <p>
                Optional AI features (resume parse, ATS-style scoring, Talent Intelligence, cover
                letters) send resume-derived text to Groq to generate structured suggestions. You
                can refrain from uploading a resume and still browse public listings.
              </p>
              <p>
                <strong>Right to object:</strong> email {PRIVACY_EMAIL} with the subject line
                &quot;Object to automated matching&quot;. We will disable personalized match scoring
                on your account where technically feasible and confirm when it is off. Objecting does
                not stop you from using the tracker or vault with manually added jobs.
              </p>
            </>
          ),
        },
        {
          id: "contact-and-representatives",
          title: "Contact for privacy requests and EU Article 27 representative",
          content: (
            <>
              <p>
                Privacy requests:{" "}
                <a className="text-brand underline-offset-4 hover:underline" href={`mailto:${PRIVACY_EMAIL}`}>
                  {PRIVACY_EMAIL}
                </a>
                . General contact:{" "}
                <Link className="text-brand underline-offset-4 hover:underline" href="/#contact">
                  Contact
                </Link>
                .
              </p>
              <p>
                <strong>EU Article 27 representative:</strong> as of this draft WorkGraph has{" "}
                <strong>not</strong> appointed an EU Article 27 representative. If counsel determines
                that Article 27 applies, we will name the representative (name, address, and email)
                in this section and in the DPA before processing EU personal data at that scale.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
