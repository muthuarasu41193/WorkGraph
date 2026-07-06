import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PaginationProps = React.ComponentProps<"nav"> & {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  siblingCount?: number
}

function Pagination({
  className,
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  ...props
}: PaginationProps) {
  const pages = React.useMemo(() => {
    if (totalPages <= 1) return [1]

    const range: (number | "ellipsis")[] = []
    const left = Math.max(2, page - siblingCount)
    const right = Math.min(totalPages - 1, page + siblingCount)

    range.push(1)
    if (left > 2) range.push("ellipsis")
    for (let i = left; i <= right; i += 1) range.push(i)
    if (right < totalPages - 1) range.push("ellipsis")
    if (totalPages > 1) range.push(totalPages)

    return range
  }, [page, siblingCount, totalPages])

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      data-slot="pagination"
      className={cn("flex items-center justify-center gap-1", className)}
      {...props}
    >
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>

      {pages.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="flex size-8 items-center justify-center text-muted-foreground"
            aria-hidden
          >
            <MoreHorizontal className="size-4" />
          </span>
        ) : (
          <Button
            key={item}
            type="button"
            variant={item === page ? "default" : "outline"}
            size="icon-sm"
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        ),
      )}

      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  )
}

export { Pagination }
