"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ProductJobCard } from "@/components/product/JobCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Text } from "@/components/ui/text"
import type { RecommendedJobCard } from "@/lib/job-dashboard"
import { jobCardView } from "@/lib/job-feed"

export function HeroSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [jobs, setJobs] = useState<RecommendedJobCard[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  function search(value: string) {
    setQuery(value)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const trimmed = value.trim()
      if (trimmed.length < 2) {
        setJobs(null)
        setError(null)
        return
      }
      void fetch(`/api/jobs?q=${encodeURIComponent(trimmed)}&page_size=3&rank_profile=0&signals=0`)
        .then(async (res) => {
          const data = (await res.json()) as { ok?: boolean; jobs?: RecommendedJobCard[] }
          if (!res.ok || !data.ok) {
            setError("Could not load jobs.")
            setJobs([])
            return
          }
          setError(null)
          setJobs(data.jobs ?? [])
        })
        .catch(() => {
          setError("Could not load jobs.")
          setJobs([])
        })
    }, 180)
  }

  return (
    <div className="space-y-3">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          const trimmed = query.trim()
          router.push(trimmed ? `/jobs?q=${encodeURIComponent(trimmed)}` : "/jobs")
        }}
      >
        <Input className="min-h-11" aria-label="Search live jobs" placeholder="Search live jobs" value={query} onChange={(event) => search(event.target.value)} />
        <Button type="submit" className="min-h-11">Search jobs</Button>
      </form>
      {error ? <Text role="body-small" className="text-danger">{error}</Text> : null}
      {jobs && jobs.length === 0 ? <Text role="body-small">No roles matched that search.</Text> : null}
      <div className="space-y-3">
        {(jobs ?? []).map((job) => {
          const view = jobCardView(job)
          return (
            <ProductJobCard
              key={job.id}
              title={job.title}
              company={job.company}
              location={job.location}
              remoteType={view.remoteType}
              salary={view.salary}
              match={view.match}
              freshness={view.freshness}
              source={view.source}
              trust={view.trust}
              applyLabel="Open"
              onApply={() => router.push(`/jobs/${encodeURIComponent(job.id)}`)}
              onSave={() => router.push("/login?next=/jobs")}
              onDismiss={() => router.push(`/jobs?q=${encodeURIComponent(query)}`)}
            />
          )
        })}
      </div>
    </div>
  )
}
