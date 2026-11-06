"use client"

import { useEffect, useState } from "react"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatExactLocalTime, formatUpdatedRelative } from "@/lib/format-updated"
import type { IndexStats } from "@/lib/social-proof-server"
import { FOCUS_RING } from "@/lib/focus-ring"
import { cn } from "@/lib/utils"

function formatCount(value: number, locale?: string) {
  return new Intl.NumberFormat(locale).format(value)
}

function StatSlot({
  label,
  value,
  locale,
}: {
  label: string
  value: number | null
  locale?: string
}) {
  return (
    <div className="min-h-14">
      <p className="font-numeric text-role-heading tabular-nums text-ink">
        {value == null ? "—" : formatCount(value, locale)}
      </p>
      <Text role="caption" className="text-ink-muted">
        {label}
      </Text>
    </div>
  )
}

const HOW_WE_COUNT = [
  "Posted means the listing date we stored. It is not a verification time.",
  "Suspected scams removed this month are not shown because that count is not stored.",
] as const

export function IndexPanel({
  stats,
  countedAt,
}: {
  stats: IndexStats
  countedAt: string
}) {
  const [now, setNow] = useState(() => Date.now())
  const [locale, setLocale] = useState<string | undefined>(undefined)

  useEffect(() => {
    setLocale(typeof navigator !== "undefined" ? navigator.language : undefined)
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const relative = formatUpdatedRelative(countedAt, now, locale)
  const exact = formatExactLocalTime(countedAt, locale)
  const showVerificationSoon = stats.verifiedEmployers === 0

  return (
    <aside className="rounded-card border border-hairline bg-surface-raised p-4">
      <div className="flex items-start justify-between gap-3">
        <Text as="h2" role="subheading">
          Index
        </Text>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("min-h-11 px-2 text-ink-muted", FOCUS_RING)}
            >
              How we count
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 space-y-3">
            <Text as="h3" role="body-small" className="font-medium text-ink">
              How we count
            </Text>
            {HOW_WE_COUNT.map((paragraph) => (
              <Text key={paragraph} role="body-small" className="text-ink-muted">
                {paragraph}
              </Text>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      <div className="mt-3 grid gap-4">
        <StatSlot label="Jobs in the index" value={stats.liveJobs} locale={locale} />
        <StatSlot
          label="Posted in the last 24 hours"
          value={stats.postedLast24Hours}
          locale={locale}
        />
      </div>

      <div className="mt-3 min-h-10">
        {showVerificationSoon ? (
          <Text role="caption" className="text-ink-subtle">
            Employer verification: opening soon
          </Text>
        ) : stats.verifiedEmployers != null && stats.verifiedEmployers > 0 ? (
          <div>
            <p className="font-numeric text-role-heading tabular-nums text-ink">
              {formatCount(stats.verifiedEmployers, locale)}
            </p>
            <Text role="caption" className="text-ink-muted">
              Verified employers
            </Text>
          </div>
        ) : null}
      </div>

      <div className="mt-3 min-h-5">
        {relative ? (
          <Text
            role="caption"
            className="text-ink-subtle"
            title={exact ?? undefined}
          >
            {relative}
          </Text>
        ) : null}
      </div>
    </aside>
  )
}
