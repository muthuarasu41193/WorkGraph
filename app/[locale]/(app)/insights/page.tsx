import Link from "next/link"

const LINKS = [
  { href: "/profile?view=resume-intelligence", label: "Resume intelligence" },
  { href: "/profile?view=cover-letters", label: "Cover letters" },
  { href: "/profile?view=home", label: "Home dashboard" },
]

export default function InsightsPage() {
  return (
    <main className="measure p-4">
      <h2 className="text-role-heading">Insights</h2>
      <p className="text-role-body text-ink-muted">
        These tools already live on your profile. This page only points at them.
      </p>
      <ul className="mt-4 space-y-2">
        {LINKS.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="inline-flex min-h-11 items-center text-role-body text-accent underline-offset-4 hover:underline">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
