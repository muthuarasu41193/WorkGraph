import { cn } from "@/lib/utils"

/** First focusable control on a page. The target is `#main-content`. */
export function SkipLink({ className }: { className?: string }) {
  return (
    <a
      href="#main-content"
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-toast focus:rounded-control focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink",
        className,
      )}
    >
      Skip to main content
    </a>
  )
}
