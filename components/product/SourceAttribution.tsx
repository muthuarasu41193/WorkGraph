import { cn } from "@/lib/utils"

/**
 * "via {source}" opens in a new tab. Partner attribution is a separate sentence when a partner requires it.
 */
export type SourceAttributionProps = {
  source: string
  href: string
  attribution?: string
  loading?: boolean
  error?: string
  className?: string
}

export function SourceAttribution({ source, href, attribution, loading = false, error, className }: SourceAttributionProps) {
  if (loading) {
    return <div className={cn("h-5 w-28 rounded-control bg-surface-sunken", className)} aria-hidden />
  }
  if (error) {
    return (
      <p className={cn("text-role-caption text-danger", className)} role="alert">
        {error}
      </p>
    )
  }
  return (
    <p className={cn("text-role-caption text-ink-muted", className)}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center underline-offset-4 hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-accent"
      >
        via {source}
      </a>
      {attribution ? <span className="mt-0.5 block text-ink-subtle">{attribution}</span> : null}
    </p>
  )
}
