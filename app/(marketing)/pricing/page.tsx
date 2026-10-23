import type { Metadata } from "next"
import { PricingTiers } from "@/components/marketing/PricingTiers"
import { Text } from "@/components/ui/text"

export const metadata: Metadata = { title: "Pricing" }

export default function PricingPage() {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-8">
      <Text as="h1" role="title">Pricing</Text>
      <Text role="body" className="mt-3 max-w-2xl text-ink-muted">
        Three tiers exist in the product. The enforced limits are cover letters and interview questions. There is no published checkout price, countdown, or seat cap.
      </Text>
      <div className="mt-6">
        <PricingTiers />
      </div>
    </main>
  )
}
