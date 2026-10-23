"use client"

import "./globals.css"
import { Button } from "@/components/ui/button"

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-surface px-4 py-8 text-ink">
        <h1 className="text-role-heading">This page did not load</h1>
        <p className="mt-2 text-role-body text-ink-muted">The page stopped before it could finish. Refresh it to try again.</p>
        <Button type="button" className="mt-4 min-h-11" onClick={() => reset()}>
          Try again
        </Button>
      </body>
    </html>
  )
}
