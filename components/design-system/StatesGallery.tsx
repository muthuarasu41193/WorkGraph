"use client"

import { useState } from "react"
import { DelayedSkeleton } from "@/components/states/DelayedSkeleton"
import { EmptyState } from "@/components/states/EmptyState"
import { PageSkeleton } from "@/components/states/PageSkeleton"
import { SourceGapNote } from "@/components/states/SourceGapNote"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { toast } from "@/hooks/use-toast"
import { messages } from "@/lib/messages"

export function StatesGallery() {
  const [saved, setSaved] = useState(false)
  const [rejection, setRejection] = useState("")

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <Text as="h2" role="subheading">Loading</Text>
        <Text role="body-small" className="text-ink-muted">{messages.statesLoading}</Text>
        <DelayedSkeleton label="Loading the sample">
          <PageSkeleton />
        </DelayedSkeleton>
      </section>

      <section className="space-y-2">
        <Text as="h2" role="subheading">Streaming</Text>
        <Text role="body-small" className="text-ink-muted">{messages.statesStreaming}</Text>
      </section>

      <section className="space-y-2">
        <Text as="h2" role="subheading">Nothing added yet</Text>
        <EmptyState
          title={messages.statesEmptyTitle}
          reason={messages.statesEmptyReason}
          actionLabel={messages.trackerFindRole}
          actionHref="/jobs"
        />
      </section>

      <section className="space-y-2">
        <Text as="h2" role="subheading">No results for a filter</Text>
        <EmptyState
          title={messages.statesFilterTitle}
          reason={messages.statesFilterReason}
          actionLabel={messages.statesFilterAction}
          onAction={() => toast({ title: "Removed posted today" })}
        />
      </section>

      <section className="space-y-2">
        <Text as="h2" role="subheading">Error</Text>
        <div className="rounded-card border border-hairline p-4">
          <Text as="h3" role="subheading">{messages.statesPageDidNotLoad}</Text>
          <Text role="body-small" className="mt-2 text-ink-muted">{messages.statesPageStopped}</Text>
          <Button type="button" className="mt-4 min-h-11" onClick={() => toast({ title: messages.statesTryAgain })}>{messages.statesTryAgain}</Button>
        </div>
      </section>

      <section className="space-y-2">
        <Text as="h2" role="subheading">Offline</Text>
        <Text role="body-small" className="text-ink-muted">A banner pins to the top when the browser reports no connection. Stage moves wait on this device and save when the connection returns.</Text>
      </section>

      <section className="space-y-2">
        <Text as="h2" role="subheading">One source failed</Text>
        <SourceGapNote source="a source that did not respond" />
        <Text role="caption" className="text-ink-subtle">{messages.statesSourceDemo}</Text>
      </section>

      <section className="space-y-2">
        <Text as="h2" role="subheading">Success</Text>
        <Button
          type="button"
          className="min-h-11"
          onClick={() => toast({ title: messages.statesSaved, onUndo: () => toast({ title: messages.statesUndoSave }) })}
        >
          {messages.statesSave}
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
              setRejection(messages.statesOptimisticRejected)
            }, 700)
          }}
        >
          {saved ? messages.statesSaved : messages.statesSave}
        </Button>
        {rejection ? <Text role="body-small" className="text-danger">{rejection}</Text> : null}
      </section>
    </div>
  )
}
