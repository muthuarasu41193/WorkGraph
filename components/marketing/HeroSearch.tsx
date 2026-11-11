"use client"

import { forwardRef, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Text } from "@/components/ui/text"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FOCUS_RING } from "@/lib/focus-ring"
import { cn } from "@/lib/utils"

const EXAMPLE_SEARCHES = [
  { label: "Backend engineer", q: "Backend engineer" },
  { label: "Data analyst", q: "Data analyst" },
] as const

/** Country names used only as `loc` filter text — not market-size claims. */
const COUNTRY_CHOICES = [
  "India",
  "United States",
  "United Kingdom",
  "Germany",
  "Canada",
  "Singapore",
  "Nigeria",
  "Brazil",
  "Australia",
  "United Arab Emirates",
] as const

type ChipId = "remote" | "today" | "salary" | "country"

function buildJobsHref(opts: {
  q: string
  remote: boolean
  today: boolean
  salary: boolean
  country: string | null
}) {
  const params = new URLSearchParams()
  const trimmed = opts.q.trim()
  if (trimmed) params.set("q", trimmed)
  if (opts.remote) params.set("locMode", "remote")
  if (opts.today) params.set("date", "1")
  if (opts.salary) params.set("pay", "stated")
  if (opts.country) params.set("loc", opts.country)
  const qs = params.toString()
  return qs ? `/jobs?${qs}` : "/jobs"
}

const ChipButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }
>(function ChipButton({ active, className, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      {...props}
      className={cn(
        "inline-flex min-h-11 items-center rounded-control border px-3 text-role-body-small transition-colors duration-base ease-out",
        FOCUS_RING,
        active
          ? "border-accent bg-accent-wash text-accent"
          : "border-hairline bg-surface-raised text-ink-muted hover:border-ink-muted hover:text-ink",
        className,
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  )
})

export function HeroSearch() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [remote, setRemote] = useState(false)
  const [today, setToday] = useState(false)
  const [salary, setSalary] = useState(false)
  const [country, setCountry] = useState<string | null>(null)
  const [countryOpen, setCountryOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (!target) return
      const tag = target.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) {
        return
      }
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  function go(nextQuery = query) {
    router.push(
      buildJobsHref({
        q: nextQuery,
        remote,
        today,
        salary,
        country,
      }),
    )
  }

  function toggle(chip: ChipId) {
    if (chip === "remote") setRemote((v) => !v)
    if (chip === "today") setToday((v) => !v)
    if (chip === "salary") setSalary((v) => !v)
  }

  return (
    <div className="space-y-3">
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-stretch"
        onSubmit={(event) => {
          event.preventDefault()
          go()
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Input
            ref={inputRef}
            className="min-h-12 w-full rounded-control border-hairline px-4 pe-12 text-role-body"
            aria-label="Search live jobs"
            placeholder="Search roles, skills, or companies"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
          <kbd
            className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 rounded-control border border-hairline bg-surface-sunken px-1.5 font-mono text-role-caption text-ink-subtle sm:inline-flex"
            aria-hidden
          >
            /
          </kbd>
        </div>
        <Button type="submit" className="min-h-12 rounded-control px-5 sm:min-w-36">
          Search jobs
        </Button>
      </form>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Search filters">
        <ChipButton active={remote} onClick={() => toggle("remote")}>
          Remote
        </ChipButton>
        <ChipButton active={today} onClick={() => toggle("today")}>
          Posted today
        </ChipButton>
        <ChipButton active={salary} onClick={() => toggle("salary")}>
          Salary shown
        </ChipButton>
        <Popover open={countryOpen} onOpenChange={setCountryOpen}>
          <PopoverTrigger asChild>
            <ChipButton active={Boolean(country)} aria-haspopup="dialog">
              {country ? `Country: ${country}` : "Country"}
            </ChipButton>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-2">
            <ul className="max-h-64 space-y-1 overflow-auto" role="listbox" aria-label="Country">
              <li>
                <button
                  type="button"
                  className={cn(
                    "flex min-h-11 w-full items-center rounded-control px-3 text-start text-role-body-small text-ink-muted",
                    FOCUS_RING,
                    "hover:bg-surface-sunken hover:text-ink",
                  )}
                  onClick={() => {
                    setCountry(null)
                    setCountryOpen(false)
                  }}
                >
                  Any country
                </button>
              </li>
              {COUNTRY_CHOICES.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={country === name}
                    className={cn(
                      "flex min-h-11 w-full items-center rounded-control px-3 text-start text-role-body-small",
                      FOCUS_RING,
                      country === name
                        ? "bg-accent-wash text-accent"
                        : "text-ink hover:bg-surface-sunken",
                    )}
                    onClick={() => {
                      setCountry(name)
                      setCountryOpen(false)
                    }}
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Text role="caption" className="text-ink-subtle">
          Try
        </Text>
        {EXAMPLE_SEARCHES.map((example) => (
          <button
            key={example.q}
            type="button"
            className={cn(
              "min-h-11 text-role-body-small text-ink underline-offset-4 hover:underline",
              FOCUS_RING,
            )}
            onClick={() => {
              setQuery(example.q)
              router.push(
                buildJobsHref({
                  q: example.q,
                  remote,
                  today,
                  salary,
                  country,
                }),
              )
            }}
          >
            {example.label}
          </button>
        ))}
      </div>
    </div>
  )
}
