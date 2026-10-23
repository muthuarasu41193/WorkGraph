import { redirect } from "next/navigation"
import { PullToRefresh } from "@/components/states/PullToRefresh"
import { TrackerBoard } from "@/components/tracker/TrackerBoard"
import { listApplicationsForUser } from "@/lib/applications-server"
import { getSessionUser } from "@/lib/auth/session-server"
import type { Application } from "@/lib/applications"

export const dynamic = "force-dynamic"

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function TrackerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await getSessionUser()
  if (!user) redirect("/login?next=/tracker")

  const raw = await searchParams
  let applications: Application[] = []
  let loadError: string | null = null
  try {
    applications = await listApplicationsForUser()
  } catch {
    loadError = "Applications could not be loaded. You can try the page again."
  }

  return (
    <PullToRefresh>
      <TrackerBoard initial={applications} loadError={loadError} initialSelectedId={first(raw.application) ?? null} />
    </PullToRefresh>
  )
}
