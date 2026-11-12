import Link from "next/link"
import { cn } from "@/lib/utils"

/** Persistent route to a human. Uses product tokens — not a floating marketing sticker. */
export function FeedbackLink({ className }: { className?: string }) {
  return (
    <Link
      href="/contact"
      className={cn(
        "fixed bottom-20 start-3 z-sticky inline-flex min-h-11 items-center rounded-control border border-hairline bg-surface-raised px-3 text-role-caption text-ink shadow-flat",
        "hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        "motion-reduce:transition-none md:bottom-4",
        className,
      )}
    >
      Send feedback to a person
    </Link>
  )
}
