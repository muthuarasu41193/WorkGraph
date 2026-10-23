import type { Metadata } from "next"
import Link from "next/link"
import { Text } from "@/components/ui/text"
import { SOURCE_LABELS } from "@/lib/job-card-data"

export const metadata: Metadata = { title: "Where jobs come from" }

export default function SourcesPage() {
  const sources = Object.entries(SOURCE_LABELS)
  return (
    <main className="measure px-4 py-8">
      <Text as="h1" role="title">Where jobs come from</Text>
      <Text role="body" className="mt-3 text-ink-muted">
        These are ingest sources for the public jobs index. A name here is not a customer, a partner logo, or a claim that the employer has a relationship with WorkGraph.
      </Text>
      <ul className="mt-6 space-y-2">
        {sources.map(([id, label]) => (
          <li key={id} className="text-role-body-small">{label}</li>
        ))}
      </ul>
      <Link href="/jobs" className="mt-6 inline-flex min-h-11 items-center text-accent">Search the index</Link>
    </main>
  )
}
