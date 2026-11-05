import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session-server";
import { getEmployerProfileForUser } from "@/lib/employer/employer-server";
import EmployerShell from "@/components/employer/EmployerShell";
import { LegalNav } from "@/components/legal/LegalDocument";
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
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-center text-sm text-muted-foreground">
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

  return (
    <div className="min-h-dvh">
      <EmployerShell companyName={companyName}>{children}</EmployerShell>
      <footer className="border-t border-border-default bg-background px-4 py-4">
        <LegalNav className="mx-auto max-w-6xl" />
      </footer>
    </div>
  );
}
