import type { Metadata } from "next"
import { PricingTiers } from "@/components/marketing/PricingTiers"
import { Text } from "@/components/ui/text"
import { getSessionUser } from "@/lib/auth/session-server"

export const metadata: Metadata = { title: "Pricing" }
export const dynamic = "force-dynamic"

export default async function PricingPage() {
  const session = await getSessionUser()
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-8">
      <Text as="h1" role="title">Pricing</Text>
      <Text role="body" className="mt-3 max-w-2xl text-ink-muted">
        WorkGraph Pass is a one-time payment in INR. It does not auto-renew. Pro stays a profile flag with no public price. The enforced limit shown here is cover letters per month.
      </Text>
      <div className="mt-6">
        <PricingTiers signedIn={Boolean(session)} />
      </div>
    </main>
  )
}
