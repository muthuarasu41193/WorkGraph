"use client"

import * as React from "react"
import { format, addMonths, startOfMonth, getDay, getDaysInMonth, isSameDay, isValid, parseISO } from "date-fns"

import { formFieldClasses } from "@/lib/form-field-styles"
import { FOCUS_RING } from "@/lib/focus-ring"
import { passthroughClass, type PreviewState } from "@/lib/primitive"
import { cn } from "@/lib/utils"

type DatePickerProps = {
  id?: string
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  readOnly?: boolean
  loading?: boolean
  error?: boolean
  preview?: PreviewState
  className?: string
  placeholder?: string
  errorMessage?: string
}

function monthGrid(cursor: Date) {
  const start = startOfMonth(cursor)
  const lead = getDay(start)
  const days = getDaysInMonth(cursor)
  const cells: Array<Date | null> = [...Array.from({ length: lead }, () => null)]
  for (let day = 1; day <= days; day += 1) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), day))
  return cells
}

/** Calendar popover. Arrow keys move the highlighted day. Enter commits it. */
const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  {
    id,
    value,
    onValueChange,
    disabled,
    readOnly,
    loading,
    error,
    preview,
    className,
    placeholder = "Choose a date",
    errorMessage = "Enter a valid date",
  },
  ref,
) {
  const selected = value && isValid(parseISO(value)) ? parseISO(value) : undefined
  const [open, setOpen] = React.useState(false)
  const [cursor, setCursor] = React.useState(selected ?? new Date())
  const [highlight, setHighlight] = React.useState(selected?.getDate() ?? 1)
  const isDisabled = Boolean(disabled || preview === "disabled")
  const isReadOnly = Boolean(readOnly || preview === "readonly")
  const isLoading = Boolean(loading || preview === "loading")
  const isError = Boolean(error || preview === "error")
  const cells = monthGrid(cursor)
  const labelId = React.useId()

  function commit(day: Date) {
    onValueChange?.(format(day, "yyyy-MM-dd"))
    setOpen(false)
  }

  return (
    <div className={cn("relative", passthroughClass(className))} data-preview={preview}>
      <input
        ref={ref}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={labelId}
        aria-invalid={isError || undefined}
        aria-busy={isLoading || undefined}
        disabled={isDisabled}
        readOnly
        placeholder={isLoading ? "Loading calendar" : placeholder}
        value={selected ? format(selected, "d MMM yyyy") : ""}
        onFocus={() => {
          if (!isDisabled && !isReadOnly) setOpen(true)
        }}
        onKeyDown={(event) => {
          if (isDisabled || isReadOnly) return
          if (event.key === "ArrowDown" || event.key === "Enter") {
            event.preventDefault()
            setOpen(true)
          }
          if (!open) return
          if (event.key === "ArrowRight") setHighlight((day) => Math.min(day + 1, getDaysInMonth(cursor)))
          if (event.key === "ArrowLeft") setHighlight((day) => Math.max(day - 1, 1))
          if (event.key === "ArrowDown" && event.target === event.currentTarget) return
          if (event.key === "PageDown") setCursor((month) => addMonths(month, 1))
          if (event.key === "PageUp") setCursor((month) => addMonths(month, -1))
          if (event.key === "Enter" && open) commit(new Date(cursor.getFullYear(), cursor.getMonth(), highlight))
          if (event.key === "Escape") setOpen(false)
        }}
        className={cn(formFieldClasses, "min-h-11", isReadOnly && "border-dashed bg-surface-sunken")}
      />
      {isError ? <p className="mt-1 text-role-caption text-danger">{errorMessage}</p> : null}
      {open && !isDisabled && !isReadOnly ? (
        <div id={labelId} role="dialog" aria-label="Choose a date" className="absolute z-overlay mt-1 w-72 rounded-overlay border border-hairline bg-surface-raised p-3 shadow-overlay">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" className={cn("min-h-11 min-w-11 rounded-control px-2 text-role-caption", FOCUS_RING)} onClick={() => setCursor((month) => addMonths(month, -1))}>
              Previous
            </button>
            <p className="text-role-body-small font-medium tabular-nums">{format(cursor, "MMMM yyyy")}</p>
            <button type="button" className={cn("min-h-11 min-w-11 rounded-control px-2 text-role-caption", FOCUS_RING)} onClick={() => setCursor((month) => addMonths(month, 1))}>
              Next
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1" role="grid">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <span key={day} className="text-center text-role-caption text-ink-subtle">{day}</span>
            ))}
            {cells.map((day, index) =>
              day ? (
                <button
                  key={day.toISOString()}
                  type="button"
                  role="gridcell"
                  aria-selected={selected ? isSameDay(day, selected) : undefined}
                  className={cn(
                    "min-h-11 rounded-control text-role-caption tabular-nums",
                    FOCUS_RING,
                    "hover:bg-surface-sunken",
                    highlight === day.getDate() && "bg-surface-sunken",
                    selected && isSameDay(day, selected) && "bg-accent text-accent-ink",
                  )}
                  onClick={() => commit(day)}
                >
                  {day.getDate()}
                </button>
              ) : (
                <span key={`empty-${index}`} />
              ),
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
})

export { DatePicker }
