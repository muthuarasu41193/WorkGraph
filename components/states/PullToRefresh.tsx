"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { messages } from "@/lib/messages"

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const startY = useRef(0)
  const pulled = useRef(0)
  const [hint, setHint] = useState("")

  return (
    <div
      onTouchStart={(event) => {
        if (window.scrollY > 8) return
        startY.current = event.touches[0]?.clientY ?? 0
        pulled.current = 0
      }}
      onTouchMove={(event) => {
        if (startY.current === 0 || window.scrollY > 8) return
        pulled.current = (event.touches[0]?.clientY ?? 0) - startY.current
        if (pulled.current > 48) setHint(messages.pullRelease)
      }}
      onTouchEnd={() => {
        if (pulled.current > 64) {
          setHint(messages.pullRefreshing)
          router.refresh()
        }
        startY.current = 0
        pulled.current = 0
        window.setTimeout(() => setHint(""), 400)
      }}
    >
      {hint ? <p className="px-4 py-2 text-role-caption text-ink-muted" role="status">{hint}</p> : null}
      {children}
    </div>
  )
}
