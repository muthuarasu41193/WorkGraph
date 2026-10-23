import * as React from "react"

import { lockClass, type PreviewState } from "@/lib/primitive"

type TableProps = React.ComponentProps<"table"> & {
  preview?: PreviewState
  error?: boolean
  loading?: boolean
  errorMessage?: string
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(function Table(
  { className, preview, error, loading, errorMessage = "Could not load rows", ...props },
  ref,
) {
  return (
    <div className="w-full overflow-x-auto" data-preview={preview}>
      <table
        ref={ref}
        aria-busy={loading || preview === "loading" || undefined}
        aria-invalid={error || preview === "error" || undefined}
        className={lockClass(className, "w-full border-collapse text-left text-role-body-small")}
        {...props}
      />
      {error || preview === "error" ? <p className="mt-2 text-role-caption text-danger">{errorMessage}</p> : null}
    </div>
  )
})

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead className={lockClass(className, "border-b border-hairline text-role-caption text-ink-subtle")} {...props} />
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={lockClass(className, "[&_tr:last-child]:border-0")} {...props} />
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={lockClass(
        className,
        "border-b border-hairline transition-colors duration-fast ease-standard hover:bg-surface-sunken data-[state=selected]:bg-accent-wash",
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return <th className={lockClass(className, "h-11 px-3 text-left font-medium")} {...props} />
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={lockClass(className, "px-3 py-3 align-middle tabular-nums")} {...props} />
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return <caption className={lockClass(className, "mb-2 text-left text-role-caption text-ink-muted")} {...props} />
}

function TableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Table loading>
      <TableBody>
        {Array.from({ length: rows }).map((_, index) => (
          <TableRow key={index}>
            <TableCell><span className="block h-3 w-24 rounded-control bg-surface-sunken" /></TableCell>
            <TableCell><span className="block h-3 w-16 rounded-control bg-surface-sunken" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption, TableSkeleton }
