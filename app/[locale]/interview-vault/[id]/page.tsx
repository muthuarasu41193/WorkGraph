import { notFound } from "next/navigation";
import VaultExperienceDetail from "@/components/vault/VaultExperienceDetail";
import { getSessionUser } from "@/lib/auth/session-server";
import {
  getExperienceView,
  getRelatedExperiences,
  listReviewsForExperience,
} from "@/lib/vault-server";
import { supabaseConfigured } from "@/lib/supabase-enabled";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function VaultExperiencePage({ params }: PageProps) {
  const { id } = await params;

  if (!supabaseConfigured()) {
    notFound();
  }

  const [view, user] = await Promise.all([getExperienceView(id), getSessionUser()]);

  if (!view) {
    notFound();
  }

  const [reviews, related] = await Promise.all([
    listReviewsForExperience(id),
    getRelatedExperiences(view.experience),
  ]);

  return (
    <VaultExperienceDetail
      experience={view.experience}
      preview={view.preview}
      fullContent={view.full_content}
      unlocked={view.unlocked}
      isOwner={view.is_owner}
      initialReviews={reviews}
      related={related}
      isLoggedIn={Boolean(user)}
    />
  );
}
