"use client"

import "./globals.css"
import { Button } from "@/components/ui/button"
import { messages } from "@/lib/messages"

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-surface px-4 py-8 text-ink">
        <h1 className="text-role-heading">{messages.statesPageDidNotLoad}</h1>
        <p className="mt-2 text-role-body text-ink-muted">{messages.statesPageStopped}</p>
        <Button type="button" className="mt-4 min-h-11" onClick={() => reset()}>
          {messages.statesTryAgain}
        </Button>
      </body>
    </html>
  )
}
