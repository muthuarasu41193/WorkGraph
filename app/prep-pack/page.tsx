import PrepPackClient from "@/components/prep-pack/PrepPackClient";
import { getSessionUser } from "@/lib/auth/session-server";
import { listSavedPrepPacksForUser } from "@/lib/prep-pack/server";
import { supabaseConfigured } from "@/lib/supabase-enabled";

export const dynamic = "force-dynamic";

export default async function PrepPackPage() {
  const user = await getSessionUser();
  let initialSaved: Awaited<ReturnType<typeof listSavedPrepPacksForUser>> = [];

  if (user && supabaseConfigured()) {
    try {
      initialSaved = await listSavedPrepPacksForUser();
    } catch {
      initialSaved = [];
    }
  }

  return <PrepPackClient isSignedIn={Boolean(user)} initialSaved={initialSaved} />;
}
