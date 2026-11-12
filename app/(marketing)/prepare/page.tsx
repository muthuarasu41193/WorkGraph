import type { Metadata } from "next";
import Link from "next/link";
import { PrepPackForm } from "@/components/prep-pack/PrepPackForm";
import { Text } from "@/components/ui/text";
import { getSessionUser } from "@/lib/auth/session-server";
import { ROLE_TEMPLATES } from "@/lib/prep-pack";
import { routeShareMetadata } from "@/lib/seo";

const TITLE = "Free interview prep pack";
const DESCRIPTION =
  "Paste a job description or choose a role to get requirements, Interview Vault guides, and a practice checklist. No account required.";

const share = routeShareMetadata("/prepare");

export const metadata: Metadata = {
  title: `${TITLE} | WorkGraph`,
  description: DESCRIPTION,
  alternates: share.alternates,
  openGraph: { title: `${TITLE} | WorkGraph`, description: DESCRIPTION, url: share.openGraph?.url },
  twitter: { ...share.twitter, title: `${TITLE} | WorkGraph`, description: DESCRIPTION },
};

export const dynamic = "force-dynamic";

export default async function PreparePage() {
  const user = await getSessionUser();
  const roles = ROLE_TEMPLATES.map((role) => ({
    id: role.id,
    title: role.title,
    seniority: role.seniority,
    summary: role.summary,
  }));

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <header className="space-y-3">
        <Text as="h1" role="display">
          Free interview prep pack
        </Text>
        <Text role="body" className="max-w-2xl text-ink-muted">
          Get a clear requirements breakdown, relevant Interview Vault guides, and a focused checklist.
          Job discovery stays available — interview prep is the starting point here.
        </Text>
        <Text role="body-small" className="text-ink-muted">
          Paying for guides or premium features does not guarantee an interview or an offer.{" "}
          <Link href="/trust" className="text-brand underline-offset-4 hover:underline">
            What we check
          </Link>
          .
        </Text>
      </header>

      <PrepPackForm isLoggedIn={Boolean(user)} initialRoles={roles} />
    </main>
  );
}
