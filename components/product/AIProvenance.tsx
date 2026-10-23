import Link from "next/link"

/**
 * Marks an inference. The summary is the claim. The disclosure is how it was made.
 * Omit this when the text is a stored listing field, not a generated value.
 */
export function AIProvenance({
  label = "Estimate",
  summary,
  href = "/trust#match",
  hrefLabel = "How this was derived",
  children,
}: {
  label?: string
  summary: string
  href?: string
  hrefLabel?: string
  children?: React.ReactNode
}) {
  return (
    <details className="text-role-caption text-ink-muted">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2">
        <span className="rounded-control border border-hairline bg-surface px-1.5 py-0.5 text-ink">{label}</span>
        <span>{summary}</span>
      </summary>
      <div className="space-y-2 pb-2 pl-1">
        {children}
        <Link href={href} className="inline-flex min-h-11 items-center text-accent">
          {hrefLabel}
        </Link>
      </div>
    </details>
  )
}
