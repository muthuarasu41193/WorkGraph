import { cookies } from "next/headers";

import { createServerSupabaseClient } from "@/lib/supabase";

/** Best-effort cookie sign-out. The browser also signs out after a successful delete. */
export async function signOutServerSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerSupabaseClient(cookieStore);
    await supabase.auth.signOut();
  } catch {
    // The auth user may already be gone. Do not log the client error.
  }
}
