import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session-server";
import { getEmployerProfileForUser } from "@/lib/employer/employer-server";
import EmployerShell from "@/components/employer/EmployerShell";
import { supabaseConfigured } from "@/lib/supabase-enabled";

export const dynamic = "force-dynamic";

export default async function EmployerWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login?next=/employer/dashboard");

  if (!supabaseConfigured()) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-center text-body text-muted-foreground">
        Employer features require Supabase. Configure your environment to continue.
      </div>
    );
  }

  let companyName: string | undefined;
  try {
    const profile = await getEmployerProfileForUser();
    if (!profile) redirect("/employer/onboarding");
    companyName = profile.company_name;
  } catch {
    redirect("/employer/onboarding");
  }

  return <EmployerShell companyName={companyName}>{children}</EmployerShell>;
}
