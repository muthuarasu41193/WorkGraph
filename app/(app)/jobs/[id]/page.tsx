import type { Metadata } from "next"
import { cookies } from "next/headers"
import { JobDecision } from "@/components/jobs/JobDecision"
import { getSessionUser } from "@/lib/auth/session-server"
import { fetchLiveJobByPublicId, mapJobRowToCard } from "@/lib/jobs-catalog"
import { loadUserProfile } from "@/lib/load-profile"
import { createServerSupabaseClient } from "@/lib/supabase"
import { Text } from "@/components/ui/text"
import { sanitizeJobDescription } from "@/lib/job-summary"
import Link from "next/link"

export const dynamic = "force-dynamic"

type Params = { id: string }

async function loadJob(id: string) {
  const supabase = createServerSupabaseClient(await cookies())
  return fetchLiveJobByPublicId(supabase, decodeURIComponent(id))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params
  const row = await loadJob(id)
  if (!row) return { title: "Job not in the index" }
  const title = row.title || "Job"
  const company = row.company || "Company"
  return {
    title: `${title} at ${company}`,
    description: (sanitizeJobDescription(row.description || "", company) || `${title} at ${company}`).slice(0, 180),
  }
}

export default async function JobDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const row = await loadJob(id)
  if (!row) {
    return (
      <main className="measure p-4">
        <Text as="h2" role="heading">This role is not in the live index.</Text>
        <Link href="/jobs" className="mt-3 inline-flex min-h-11 items-center text-accent">Back to jobs</Link>
      </main>
    )
  }
  const user = await getSessionUser()
  const profile = user ? await loadUserProfile(user.id) : null
  const skills = profile?.skills ?? []
  const job = mapJobRowToCard(row, skills, { skills, headline: profile?.headline, summary: profile?.summary })
  return <JobDecision job={job} userId={user?.id ?? null} />
}
