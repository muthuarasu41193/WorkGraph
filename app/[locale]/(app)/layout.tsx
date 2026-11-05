import { Suspense } from "react"
import { AppShell } from "@/components/shell/AppShell"
import { getSessionUser } from "@/lib/auth/session-server"

export const dynamic = "force-dynamic"

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  return (
    <Suspense>
      <AppShell userId={user?.id ?? null} email={user?.email ?? null}>
        {children}
      </AppShell>
    </Suspense>
  )
}
