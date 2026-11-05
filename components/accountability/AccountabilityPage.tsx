import type { ReactNode } from "react"
import { Text } from "@/components/ui/text"
import { ACCOUNTABILITY_LAST_REVIEWED } from "@/lib/accountability"

export function AccountabilityPage({
  title,
  lede,
  children,
  lastUpdated = ACCOUNTABILITY_LAST_REVIEWED,
}: {
  title: string
  lede: string
  children: ReactNode
  lastUpdated?: string
}) {
  return (
    <main id="main-content" tabIndex={-1} className="measure space-y-8 px-4 py-8 md:px-6">
      <header className="space-y-3">
        <Text as="h1" role="title">
          {title}
        </Text>
        <Text role="body" className="text-ink-muted">
          {lede}
        </Text>
        <p className="text-role-caption text-ink-subtle">
          Last updated <time dateTime={toIsoDate(lastUpdated)}>{lastUpdated}</time>
        </p>
      </header>
      {children}
    </main>
  )
}

function toIsoDate(label: string): string {
  const match = label.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/)
  if (!match) return label
  const months: Record<string, string> = {
    January: "01",
    February: "02",
    March: "03",
    April: "04",
    May: "05",
    June: "06",
    July: "07",
    August: "08",
    September: "09",
    October: "10",
    November: "11",
    December: "12",
  }
  const month = months[match[2]]
  if (!month) return label
  return `${match[3]}-${month}-${match[1].padStart(2, "0")}`
}
