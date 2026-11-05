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
      <Text as="h1" role="title">
        Pricing for job seekers
      </Text>
      <Text role="body" className="mt-3 max-w-2xl text-ink-muted">
        Start free. Buy a WorkGraph Pass when you want unlimited cover letters, tailoring, and daily
        alerts. Passes are one-time payments in INR through Razorpay. They do not auto-renew.
      </Text>
      <div className="mt-8">
        <PricingTiers signedIn={Boolean(session)} />
      </div>
    </main>
  )
}
