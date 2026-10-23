import * as React from "react"
import { ChevronRight } from "lucide-react"

import { lockClass, type PreviewState } from "@/lib/primitive"
import { cn } from "@/lib/utils"

export type BreadcrumbItem = {
  label: string
  href?: string
}

type BreadcrumbProps = {
  items: BreadcrumbItem[]
  className?: string
  preview?: PreviewState
  error?: boolean
  loading?: boolean
}

/** Trail of links. The last item is the current page. */
const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb(
  { items, className, preview, error, loading },
  ref,
) {
  if (loading || preview === "loading") {
    return <div ref={ref as React.Ref<HTMLDivElement>} className="h-6 w-48 rounded-control bg-surface-sunken" aria-hidden />
  }
  return (
    <nav ref={ref} aria-label="Breadcrumb" data-preview={preview} className={lockClass(className)}>
      <ol className={cn("flex flex-wrap items-center gap-1 text-role-caption", (error || preview === "error") && "text-danger")}>
        {items.map((item, index) => {
          const current = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="inline-flex min-h-11 items-center gap-1">
              {index > 0 ? <ChevronRight className="size-3 text-ink-subtle" aria-hidden /> : null}
              {current || !item.href ? (
                <span aria-current={current ? "page" : undefined} className={current ? "font-medium text-ink" : "text-ink-muted"}>
                  {item.label}
                </span>
              ) : (
                <a href={item.href} className="text-ink-muted underline-offset-4 hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-accent">
                  {item.label}
                </a>
              )}
            </li>
          )
        })}
      </ol>
      {error || preview === "error" ? <p className="text-role-caption text-danger">Path unavailable</p> : null}
    </nav>
  )
})

export { Breadcrumb }
