"use client"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="measure px-4 py-8">
      <Text as="h1" role="heading">This page did not load</Text>
      <Text role="body" className="mt-2 text-ink-muted">
        The page stopped before it could finish. Refresh it to try again.
      </Text>
      <Button type="button" className="mt-4 min-h-11" onClick={() => reset()}>
        Try again
      </Button>
    </main>
  )
}
