"use client"

import * as React from "react"
import { Search as SearchIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type SearchProps = Omit<React.ComponentProps<typeof Input>, "type"> & {
  loading?: boolean
  containerClassName?: string
}

const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  ({ className, containerClassName, loading = false, disabled, ...props }, ref) => {
    return (
      <div
        data-slot="search"
        className={cn("relative w-full", containerClassName)}
      >
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={ref}
          type="search"
          disabled={disabled || loading}
          className={cn("pl-9", loading && "pr-9", className)}
          {...props}
        />
        {loading ? (
          <Spinner
            size="sm"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
          />
        ) : null}
      </div>
    )
  },
)
Search.displayName = "Search"

export { Search }
