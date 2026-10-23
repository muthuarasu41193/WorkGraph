"use client"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { messages } from "@/lib/messages"

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="measure px-4 py-8">
      <Text as="h1" role="heading">{messages.statesPageDidNotLoad}</Text>
      <Text role="body" className="mt-2 text-ink-muted">
        {messages.statesPageStopped}
      </Text>
      <Button type="button" className="mt-4 min-h-11" onClick={() => reset()}>
        {messages.statesTryAgain}
      </Button>
    </main>
  )
}
