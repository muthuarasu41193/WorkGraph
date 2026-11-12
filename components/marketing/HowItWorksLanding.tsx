import { Text } from "@/components/ui/text"

const STEPS = [
  {
    title: "Search without signing in",
    body: "Type a role or skill. Results come from the jobs index. An account is not required to look.",
  },
  {
    title: "Open a listing and read the facts",
    body: "See the source, the stored posted date, and trust labels that name the check that produced them.",
  },
  {
    title: "Save a profile and log applications",
    body: "Sign in to keep a resume, get match estimates, and move stages in the tracker as replies arrive.",
  },
] as const

export function HowItWorksLanding() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="border-b border-hairline bg-surface-raised"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl space-y-3">
          <Text as="h2" role="title" id="how-heading">
            How to use it
          </Text>
          <Text role="body" className="text-ink-muted">
            Start with the index. Add a profile only when you want match notes
            or a place to record applications.
          </Text>
        </div>

        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
          {STEPS.map((step, index) => (
            <li key={step.title} className="space-y-3">
              <Text role="caption" className="text-accent tabular-nums">
                Step {index + 1}
              </Text>
              <Text as="h3" role="subheading">
                {step.title}
              </Text>
              <Text role="body-small" className="text-ink-muted">
                {step.body}
              </Text>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
