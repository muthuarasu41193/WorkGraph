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

const TITLE = "Data Processing Addendum";
const DESCRIPTION =
  "Draft processor terms for employer customers, including subprocessors, transfers, and retention.";
const share = routeShareMetadata("/legal/dpa");

export const metadata: Metadata = {
  title: `${TITLE} | WorkGraph`,
  description: DESCRIPTION,
  alternates: share.alternates,
  openGraph: { title: `${TITLE} | WorkGraph`, description: DESCRIPTION, url: share.openGraph?.url },
  twitter: { ...share.twitter, title: `${TITLE} | WorkGraph`, description: DESCRIPTION },
};

export default function DataProcessingAddendumPage() {
  return (
    <LegalDocument
      title={TITLE}
      version={LEGAL_VERSION}
      lastUpdated={LEGAL_LAST_UPDATED}
      intro={
        <p>
          This draft DPA is intended for employer or other business customers that instruct WorkGraph
          to process candidate personal data. Jobseeker accounts are described in the{" "}
          <Link className="text-brand underline-offset-4 hover:underline" href="/legal/privacy">
            Privacy Policy
          </Link>{" "}
          (WorkGraph as controller). Counsel must complete roles, annexes, and signatures before this
          document is offered.
        </p>
      }
      sections={[
        {
          id: "roles",
          title: "Roles",
          content: (
            <p>
              Customer is the controller of candidate data it submits (for example hiring-signal
              applications). WorkGraph is the processor and will process that data only on documented
              instructions, including this DPA and in-product settings. Each party remains controller
              of its own employee and billing data.
            </p>
          ),
        },
        {
          id: "categories",
          title: "Categories of personal data and purposes",
          content: (
            <>
              <p>
                Customer may submit account, resume, and application-activity data about candidates.
                Device/analytics data about users of the employer workspace is processed to provide
                and secure the service. The mapping below is the same category model used in the
                Privacy Policy.
              </p>
              <LegalTable
                headers={["Category", "Examples", "Purpose", "Lawful basis (customer)", "Retention"]}
                rows={DATA_CATEGORIES.map((row) => [
                  row.category,
                  row.examples,
                  row.purpose,
                  "Determined by the customer as controller; typically recruitment (contract or legitimate interests)",
                  row.retention,
                ])}
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
                Customer authorizes the subprocessors listed here. We will post material changes on
                this page and, once this DPA is in force, provide the notice period counsel specifies.
              </p>
              <LegalTable
                headers={["Provider", "Function", "Hosting region"]}
                rows={SUBPROCESSORS.map((row) => [row.name, row.function, row.region])}
              />
            </>
          ),
        },
        {
          id: "transfers",
          title: "International transfers",
          content: (
            <p>
              Processing occurs primarily in the United States. Draft transfer tool: Standard
              Contractual Clauses module for processor-to-processor and controller-to-processor
              relationships, plus supplementary security measures (encryption in transit, access
              control, logging). Final module selection is for counsel.
            </p>
          ),
        },
        {
          id: "security-and-assistance",
          title: "Security and assistance with data subject rights",
          content: (
            <p>
              We apply access control, TLS in transit, and row-level security on tenant data in
              Postgres where implemented. We will assist the customer with data subject requests
              that concern processor-held candidate data, by in-product tools or by email to{" "}
              {PRIVACY_EMAIL}, within the time needed for the customer to meet its statutory
              deadline.
            </p>
          ),
        },
        {
          id: "retention-and-deletion",
          title: "Retention and deletion",
          content: (
            <p>
              On termination of the employer workspace, or on written instruction, we will delete or
              return candidate data in our production systems within 30 days, except data we must
              keep for legal claims or backups that rotate out on the backup schedule (typically 30
              days). Categories follow the retention column in the table above.
            </p>
          ),
        },
        {
          id: "article-27",
          title: "EU Article 27 representative",
          content: (
            <p>
              WorkGraph has not appointed an EU Article 27 representative as of this draft. If
              appointment is required for the processing described here, the representative&apos;s
              identity and contact details will be added to this section and the Privacy Policy
              before the DPA is offered for signature.
            </p>
          ),
        },
      ]}
    />
  );
}
