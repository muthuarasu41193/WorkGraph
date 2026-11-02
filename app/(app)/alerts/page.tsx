import { redirect } from "next/navigation"
import { AlertsPageClient } from "@/components/alerts/AlertsPageClient"
import { listAlertsForUser } from "@/lib/alerts/server"
import { getSessionUser } from "@/lib/auth/session-server"
import { checkSubscription } from "@/lib/subscription"

export const dynamic = "force-dynamic"

export default async function AlertsPage() {
  const user = await getSessionUser()
  if (!user) redirect("/login?next=/alerts")

  let alerts: Awaited<ReturnType<typeof listAlertsForUser>> = []
  try {
    alerts = await listAlertsForUser()
  } catch {
    alerts = []
  }

  const status = await checkSubscription(user.id)
  const hasPass = status.isActive && status.tier !== "free"

  return <AlertsPageClient initialAlerts={alerts} hasPass={hasPass} />
}
