"use client"

import { useEffect, useState } from "react"

const SHOW_AFTER = 200

export function DelayedSkeleton({ children, label = "Loading" }: { children: React.ReactNode; label?: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), SHOW_AFTER)
    return () => window.clearTimeout(timer)
  }, [])

  if (!visible) {
    return <div className="min-h-24" aria-busy="true" />
  }

  return (
    <div aria-busy="true" aria-label={label}>
      {children}
    </div>
  )
}
