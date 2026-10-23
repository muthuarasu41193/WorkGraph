"use client"

import { useState } from "react"
import { DelayedSkeleton } from "@/components/states/DelayedSkeleton"
import { EmptyState } from "@/components/states/EmptyState"
import { PageSkeleton } from "@/components/states/PageSkeleton"
import { SourceGapNote } from "@/components/states/SourceGapNote"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { toast } from "@/hooks/use-toast"

export function StatesGallery() {
  const [saved, setSaved] = useState(false)
  const [rejection, setRejection] = useState("")

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <Text as="h2" role="subheading">Loading</Text>
        <Text role="body-small" className="text-ink-muted">The skeleton waits 200ms, then matches the page blocks. Fast responses stay blank for that moment so the loader does not flash.</Text>
        <DelayedSkeleton label="Loading the sample">
          <PageSkeleton />
        </DelayedSkeleton>
      </section>

      <section className="space-y-2">
        <Text as="h2" role="subheading">Streaming</Text>
        <Text role="body-small" className="text-ink-muted">The shell stays mounted. A route change does not wait for the previous page to fade out.</Text>
      </section>

      <section className="space-y-2">
        <Text as="h2" role="subheading">Nothing added yet</Text>
        <EmptyState
          title="Applications you log will show up here"
          reason="The tracker is empty because nothing has been logged on this account."
          actionLabel="Find a role"
          actionHref="/jobs"
        />
      </section>

      <section className="space-y-2">
        <Text as="h2" role="subheading">No results for a filter</Text>
        <EmptyState
          title="No roles match these filters"
          reason="Posted today is the filter hiding results."
          actionLabel="Remove posted today"
          onAction={() => toast({ title: "Removed posted today" })}
        />
      </section>

      <section className="space-y-2">
        <Text as="h2" role="subheading">Error</Text>
        <div className="rounded-card border border-hairline p-4">
          <Text as="h3" role="subheading">This page did not load</Text>
          <Text role="body-small" className="mt-2 text-ink-muted">The page stopped before it could finish. Refresh it to try again.</Text>
          <Button type="button" className="mt-4 min-h-11" onClick={() => toast({ title: "Tried again" })}>Try again</Button>
        </div>
      </section>

      <section className="space-y-2">
        <Text as="h2" role="subheading">Offline</Text>
        <Text role="body-small" className="text-ink-muted">A banner pins to the top when the browser reports no connection. Stage moves wait on this device and save when the connection returns.</Text>
      </section>

      <section className="space-y-2">
        <Text as="h2" role="subheading">One source failed</Text>
        <SourceGapNote source="a source that did not respond" />
        <Text role="caption" className="text-ink-subtle">The jobs API does not report which source failed, so the live feed does not invent a gap. This note is the pattern for when a source name is known.</Text>
      </section>

      <section className="space-y-2">
        <Text as="h2" role="subheading">Success</Text>
        <Button
          type="button"
          className="min-h-11"
          onClick={() => toast({ title: "Saved this search", onUndo: () => toast({ title: "Undid the save" }) })}
        >
          Save
        </Button>
      </section>

      <section className="space-y-2">
        <Text as="h2" role="subheading">Optimistic update</Text>
        <Button
          type="button"
          className="min-h-11"
          onClick={() => {
            const next = !saved
            setSaved(next)
            setRejection("")
            window.setTimeout(() => {
              setSaved(!next)
              setRejection("The server rejected the save. The button is back to the previous state.")
            }, 700)
          }}
        >
          {saved ? "Saved" : "Save"}
        </Button>
        {rejection ? <Text role="body-small" className="text-danger">{rejection}</Text> : null}
      </section>
    </div>
  )
}
