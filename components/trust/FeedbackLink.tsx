import Link from "next/link"

export function FeedbackLink({ className }: { className?: string }) {
  return (
    <Link
      href="/#contact"
      className={
        className ??
        "fixed bottom-20 left-3 z-sticky inline-flex min-h-11 items-center rounded-control border border-hairline bg-surface px-3 text-role-caption text-ink shadow-flat md:bottom-4"
      }
    >
      Send feedback to a person
    </Link>
  )
}
