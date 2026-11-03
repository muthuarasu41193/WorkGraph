/**
 * Server-only. One entitlement check for the signed-in user, not one per job.
 * The client never supplies the user id.
 */

import { canUse } from "@/lib/subscription/entitlements";
import { profileHasResume, tailorLinkHref, type TailorEntitlement } from "@/lib/job-requirements";

export async function tailorHrefForUser(
  userId: string | null | undefined,
  profile: { resume_raw_text?: string | null; resume_url?: string | null } | null | undefined,
): Promise<string | null> {
  if (!userId || !profileHasResume(profile)) return null;
  const decision = await canUse(userId, "tailoring");
  const entitlement: TailorEntitlement =
    decision.reason === "ok" || decision.reason === "limit_reached" ? decision.reason : "unavailable";
  return tailorLinkHref({ hasResume: true, entitlement });
}
