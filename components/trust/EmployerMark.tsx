import Link from "next/link"
import { cn } from "@/lib/utils"

/**
 * Compact company verification mark. Links to the trust explanation.
 * Does not invent certifications or customer logos.
 */
export function EmployerMark({
  company,
  verified = false,
  className,
}: {
  company: string
  verified?: boolean
  className?: string
}) {
  return (
    <span className={cn("inline-flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span className="truncate text-role-body text-ink" title={company}>
        {company}
      </span>
      <Link
        href="/trust#verified-employer"
        className={cn(
          "inline-flex min-h-11 items-center text-role-caption underline-offset-2 hover:underline",
          verified ? "text-positive" : "text-ink-muted",
        )}
      >
        {verified ? "Company domain verified" : "Company not verified"}
      </Link>
    </span>
  )
}
