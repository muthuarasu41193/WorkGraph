import { cn } from "@/lib/utils"

export type SalaryFigure = {
  kind: "range" | "single" | "undisclosed" | "converted" | "stated"
  min?: number
  max?: number
  amount?: number
  currency?: string
  period?: string
  /** Present when kind is converted. */
  convertedFrom?: string
  rateDate?: string
  originalLabel?: string
  /** Present when kind is stated. A figure that was already formatted from real listing data. */
  label?: string
}

/**
 * Salary row. Undisclosed is an explicit sentence. Converted values keep the rate date visible.
 * Figures use tabular numerals.
 */
export type SalaryDisplayProps = {
  salary: SalaryFigure
  loading?: boolean
  error?: string
  className?: string
}

function money(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}

export function salaryText(salary: SalaryFigure): string {
  if (salary.kind === "undisclosed") return "Salary not disclosed"
  if (salary.kind === "stated") return salary.label?.trim() || "Salary not disclosed"
  const period = salary.period ? ` ${salary.period}` : ""
  if (salary.kind === "range") {
    return `${money(salary.min ?? 0, salary.currency)}–${money(salary.max ?? 0, salary.currency)}${period}`
  }
  if (salary.kind === "converted") {
    return `${money(salary.amount ?? 0, salary.currency)}${period} converted`
  }
  return `${money(salary.amount ?? 0, salary.currency)}${period}`
}

export function SalaryDisplay({ salary, loading = false, error, className }: SalaryDisplayProps) {
  if (loading) {
    return <div className={cn("h-5 w-40 rounded-control bg-surface-sunken", className)} aria-hidden />
  }
  if (error) {
    return (
      <p className={cn("text-role-body-small font-medium text-danger", className)} role="alert">
        {error}
      </p>
    )
  }
  return (
    <p className={cn("text-role-body-small text-ink", className)}>
      <span className="font-medium tabular-nums">{salaryText(salary)}</span>
      {salary.kind === "converted" ? (
        <span className="mt-0.5 block text-role-caption text-ink-muted">
          Converted from {salary.originalLabel ?? salary.convertedFrom}. Rate date {salary.rateDate}.
        </span>
      ) : null}
    </p>
  )
}
