"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { formFieldClasses } from "@/lib/form-field-styles"
import { passthroughClass, type PreviewState } from "@/lib/primitive"
import { cn } from "@/lib/utils"

export type ComboboxOption = {
  value: string
  label: string
  disabled?: boolean
}

type ComboboxProps = {
  id?: string
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  loading?: boolean
  error?: boolean
  preview?: PreviewState
  className?: string
  name?: string
  /** Shown under the field when error is set. */
  errorMessage?: string
}

/**
 * Searchable single-select. Arrow keys move, Enter selects, Escape closes.
 * Colour classes in className are ignored.
 */
const Combobox = React.forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(
  {
    id,
    options,
    value,
    onValueChange,
    placeholder = "Search",
    disabled,
    readOnly,
    loading,
    error,
    preview,
    className,
    name,
    errorMessage = "Could not load options",
  },
  ref,
) {
  const listId = React.useId()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [active, setActive] = React.useState(0)
  const isDisabled = Boolean(disabled || preview === "disabled")
  const isReadOnly = Boolean(readOnly || preview === "readonly")
  const isLoading = Boolean(loading || preview === "loading")
  const isError = Boolean(error || preview === "error")
  const selected = options.find((option) => option.value === value)
  const filtered = options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
  const shown = open && !isDisabled && !isReadOnly

  function choose(option: ComboboxOption) {
    if (option.disabled) return
    onValueChange?.(option.value)
    setQuery("")
    setOpen(false)
  }

  return (
    <div className={cn("relative", passthroughClass(className))} data-preview={preview}>
      <input
        ref={ref}
        id={id}
        name={name}
        role="combobox"
        aria-expanded={shown}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={shown && filtered[active] ? `${listId}-${filtered[active].value}` : undefined}
        aria-invalid={isError || undefined}
        aria-busy={isLoading || undefined}
        disabled={isDisabled}
        readOnly={isReadOnly}
        placeholder={isLoading ? "Loading options" : placeholder}
        value={open ? query : selected?.label ?? ""}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          setActive(0)
        }}
        onFocus={() => {
          if (!isDisabled && !isReadOnly) setOpen(true)
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault()
            setOpen(true)
            setActive((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)))
          } else if (event.key === "ArrowUp") {
            event.preventDefault()
            setActive((index) => Math.max(index - 1, 0))
          } else if (event.key === "Enter" && shown && filtered[active]) {
            event.preventDefault()
            choose(filtered[active])
          } else if (event.key === "Escape") {
            setOpen(false)
          }
        }}
        className={cn(formFieldClasses, "min-h-11 pr-10")}
      />
      {isLoading ? (
        <Loader2 className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-ink-subtle" aria-hidden />
      ) : null}
      {isError ? <p className="mt-1 text-role-caption text-danger">{errorMessage}</p> : null}
      {shown ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-overlay mt-1 max-h-60 w-full overflow-auto rounded-card border border-hairline bg-surface-raised py-1 shadow-overlay"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-role-caption text-ink-subtle">No matches</li>
          ) : (
            filtered.map((option, index) => (
              <li
                key={option.value}
                id={`${listId}-${option.value}`}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled || undefined}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center px-3 text-role-body-small",
                  index === active && "bg-surface-sunken",
                  option.value === value && "text-accent",
                  option.disabled && "cursor-not-allowed text-ink-subtle",
                )}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => {
                  event.preventDefault()
                  choose(option)
                }}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
})

export { Combobox }
