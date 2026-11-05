import { redirect } from "next/navigation";
import ApplicationsTracker from "@/components/applications/ApplicationsTracker";
import { getSessionUser } from "@/lib/auth/session-server";
import { loadUserProfile } from "@/lib/load-profile";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login?next=/profile?view=applications");

  const profile = await loadUserProfile(sessionUser.id);
  if (!profile) redirect("/create-profile");

  return <ApplicationsTracker userId={sessionUser.id} />;
}
