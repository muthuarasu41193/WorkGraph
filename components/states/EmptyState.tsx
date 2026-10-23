import Link from "next/link"
import { Text } from "@/components/ui/text"

export function EmptyState({
  title,
  reason,
  actionLabel,
  actionHref,
  onAction,
}: {
  title: string
  reason: string
  actionLabel: string
  actionHref?: string
  onAction?: () => void
}) {
  return (
    <div className="rounded-card border border-hairline bg-surface-raised p-4">
      <Text as="h2" role="subheading">{title}</Text>
      <Text role="body-small" className="mt-2 text-ink-muted">{reason}</Text>
      {actionHref ? (
        <Link href={actionHref} className="mt-3 inline-flex min-h-11 items-center text-role-body-small text-accent">
          {actionLabel}
        </Link>
      ) : (
        <button type="button" className="mt-3 inline-flex min-h-11 items-center text-role-body-small text-accent" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
