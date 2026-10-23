"use client"

import { useRef, useState } from "react"
import { messages } from "@/lib/messages"

export function SwipeRow({
  title,
  detail,
  onOpen,
  onBack,
  onForward,
}: {
  title: string
  detail: string
  onOpen: () => void
  onBack: () => void
  onForward: () => void
}) {
  const startX = useRef(0)
  const offsetRef = useRef(0)
  const [offset, setOffset] = useState(0)

  return (
    <div className="relative overflow-hidden rounded-card border border-hairline">
      <div className="absolute inset-y-0 left-0 flex w-24 items-center justify-center bg-surface-sunken px-2 text-role-caption">{messages.swipeBack}</div>
      <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-accent-wash px-2 text-role-caption">{messages.swipeForward}</div>
      <div
        className="relative bg-surface-raised px-3 py-2"
        style={{ transform: `translate3d(${offset}px, 0, 0)` }}
        onTouchStart={(event) => {
          startX.current = event.touches[0]?.clientX ?? 0
        }}
        onTouchMove={(event) => {
          const next = Math.max(-96, Math.min(96, (event.touches[0]?.clientX ?? 0) - startX.current))
          offsetRef.current = next
          setOffset(next)
        }}
        onTouchEnd={() => {
          if (offsetRef.current > 64) onBack()
          else if (offsetRef.current < -64) onForward()
          offsetRef.current = 0
          setOffset(0)
        }}
      >
        <button type="button" className="min-h-11 w-full text-left" onClick={onOpen}>
          <span className="block text-role-body-small">{title}</span>
          <span className="block text-role-caption text-ink-muted">{detail}</span>
        </button>
        <p className="text-role-caption text-ink-subtle">{messages.swipeHint}</p>
      </div>
    </div>
  )
}
