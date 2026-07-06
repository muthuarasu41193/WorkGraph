"use client"

import * as React from "react"
import { Search as SearchIcon, X } from "lucide-react"
import { type VariantProps } from "class-variance-authority"

import {
  inputDisabledClass,
  inputFocusRingClass,
  inputInvalidClass,
  searchVariants,
} from "@/components/ui/input-styles"
import { IconButton } from "@/components/ui/icon-button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type SearchProps = Omit<React.ComponentProps<"input">, "type" | "size"> &
  VariantProps<typeof searchVariants> & {
    loading?: boolean
    containerClassName?: string
    clearable?: boolean
    onClear?: () => void
  }

const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  (
    {
      className,
      containerClassName,
      loading = false,
      disabled,
      shape,
      size,
      clearable = false,
      onClear,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = React.useState(
      () => (defaultValue as string | undefined) ?? "",
    )
    const isControlled = value !== undefined
    const currentValue = isControlled ? String(value ?? "") : internalValue
    const showClear = clearable && currentValue.length > 0 && !loading

    const handleClear = () => {
      if (!isControlled) setInternalValue("")
      onClear?.()
      onChange?.({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>)
    }

    return (
      <div
        data-slot="search"
        className={cn("group/search relative w-full", containerClassName)}
      >
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/search:text-foreground"
          aria-hidden
        />
        <input
          ref={ref}
          type="search"
          data-slot="search-input"
          disabled={disabled || loading}
          value={value}
          defaultValue={defaultValue}
          onChange={(e) => {
            if (!isControlled) setInternalValue(e.target.value)
            onChange?.(e)
          }}
          className={cn(
            inputFocusRingClass,
            inputInvalidClass,
            inputDisabledClass,
            searchVariants({ shape, size }),
            "border-border/70 bg-[var(--surface-secondary)]/80 pl-9 shadow-[var(--shadow-sm)] outline-none",
            "hover:border-[var(--border-strong)] hover:bg-[var(--surface-secondary)]",
            "focus-visible:border-[var(--border-strong)] focus-visible:bg-[var(--surface-primary)] focus-visible:shadow-[var(--shadow-md)]",
            (loading || showClear) && "pr-9",
            className,
          )}
          {...props}
        />
        {loading ? (
          <Spinner
            size="sm"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
            aria-label="Searching"
          />
        ) : showClear ? (
          <IconButton
            type="button"
            variant="ghost"
            iconSize="sm"
            label="Clear search"
            icon={<X className="size-4" />}
            className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
            onClick={handleClear}
          />
        ) : null}
      </div>
    )
  },
)
Search.displayName = "Search"

export { Search, searchVariants }
