"use client"

import * as React from "react"
import { Check, Loader2 } from "lucide-react"

import { formFieldClasses } from "@/lib/form-field-styles"
import { passthroughClass, type PreviewState } from "@/lib/primitive"
import { cn } from "@/lib/utils"
import type { ComboboxOption } from "@/components/ui/combobox"

type MultiSelectProps = {
  id?: string
  options: ComboboxOption[]
  value?: string[]
  onValueChange?: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  loading?: boolean
  error?: boolean
  preview?: PreviewState
  className?: string
  errorMessage?: string
}

/** Searchable multi-select. Space or Enter toggles the active option. */
const MultiSelect = React.forwardRef<HTMLInputElement, MultiSelectProps>(function MultiSelect(
  {
    id,
    options,
    value = [],
    onValueChange,
    placeholder = "Select",
    disabled,
    readOnly,
    loading,
    error,
    preview,
    className,
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
  const filtered = options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
  const shown = open && !isDisabled && !isReadOnly

  function toggle(option: ComboboxOption) {
    if (option.disabled || isReadOnly) return
    const next = value.includes(option.value) ? value.filter((item) => item !== option.value) : [...value, option.value]
    onValueChange?.(next)
  }

  return (
    <div className={cn("relative", passthroughClass(className))} data-preview={preview}>
      <div className="mb-1 flex flex-wrap gap-1">
        {value.map((item) => {
          const option = options.find((entry) => entry.value === item)
          return (
            <span key={item} className="rounded-control bg-accent-wash px-2 py-0.5 text-role-caption text-accent">
              {option?.label ?? item}
            </span>
          )
        })}
      </div>
      <input
        ref={ref}
        id={id}
        role="combobox"
        aria-expanded={shown}
        aria-controls={listId}
        aria-invalid={isError || undefined}
        aria-busy={isLoading || undefined}
        disabled={isDisabled}
        readOnly={isReadOnly}
        placeholder={isLoading ? "Loading options" : placeholder}
        value={query}
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
          } else if ((event.key === "Enter" || event.key === " ") && shown && filtered[active]) {
            event.preventDefault()
            toggle(filtered[active])
          } else if (event.key === "Escape") {
            setOpen(false)
          }
        }}
        className={cn(formFieldClasses, "min-h-11")}
      />
      {isLoading ? (
        <Loader2 className="pointer-events-none absolute right-3 bottom-3 size-4 animate-spin text-ink-subtle" aria-hidden />
      ) : null}
      {isError ? <p className="mt-1 text-role-caption text-danger">{errorMessage}</p> : null}
      {shown ? (
        <ul id={listId} role="listbox" aria-multiselectable="true" className="absolute z-overlay mt-1 max-h-60 w-full overflow-auto rounded-card border border-hairline bg-surface-raised py-1 shadow-overlay">
          {filtered.map((option, index) => {
            const selected = value.includes(option.value)
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={selected}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-2 px-3 text-role-body-small",
                  index === active && "bg-surface-sunken",
                  selected && "text-accent",
                )}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => {
                  event.preventDefault()
                  toggle(option)
                }}
              >
                <span className={cn("flex size-4 items-center justify-center rounded-control border border-hairline", selected && "border-accent bg-accent text-accent-ink")} aria-hidden>
                  {selected ? <Check className="size-3" /> : null}
                </span>
                {option.label}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
})

export { MultiSelect }
