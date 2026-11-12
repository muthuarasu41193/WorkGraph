import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrepPackResultView } from "@/components/prep-pack/PrepPackResult";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { getSessionUser } from "@/lib/auth/session-server";
import { getPrepPackShare } from "@/lib/prep-pack";
import { supabaseConfigured } from "@/lib/supabase-enabled";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ shareId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareId } = await params;
  return {
    title: "Shared interview prep pack | WorkGraph",
    description: "A shared prep pack with requirements, guides, and a checklist. Pasted job descriptions are not included.",
    robots: { index: false, follow: false },
    alternates: { canonical: `/prepare/${shareId}` },
  };
}

export default async function SharedPrepPackPage({ params }: Props) {
  const { shareId } = await params;
  if (!supabaseConfigured() || !shareId || shareId.length < 16 || shareId.length > 64) {
    notFound();
  }

  const shared = await getPrepPackShare(shareId);
  if (!shared) notFound();

  const user = await getSessionUser();
  const pack = { ...shared, share_id: shareId };

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <header className="space-y-3">
        <Text as="h1" role="display">
          Shared prep pack
        </Text>
        <Text role="body" className="text-ink-muted">
          This page shows extracted requirements, matched guides, and a checklist. It does not include
          any pasted job description or private profile data.
        </Text>
      </header>

      <PrepPackResultView pack={pack} isLoggedIn={Boolean(user)} sharedView />

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/prepare">Build your own pack</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/interview-vault">Interview Vault</Link>
        </Button>
      </div>
    </main>
  );
}
