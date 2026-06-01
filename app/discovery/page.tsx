import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session-server";

export const dynamic = "force-dynamic";

/** Short URL for Hidden Jobs Discovery — sends logged-in users straight to the aggregator. */
export default async function DiscoveryPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/discovery");
  }
  redirect("/profile?view=job-discovery");
}
