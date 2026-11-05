import type { Metadata } from "next"
import { SeekerPricingGallery } from "@/components/marketing/SeekerPricingGallery"
import { Text } from "@/components/ui/text"

export const metadata: Metadata = {
  title: "Dev components — WorkGraph",
  robots: { index: false, follow: false },
}

export default function DevComponentsPage() {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-8">
      <Text as="h1" role="title">
        Component gallery
      </Text>
      <Text role="body" className="mt-2 max-w-2xl text-ink-muted">
        Specimens for new marketing pricing UI. Includes loading, empty, error, populated, long
        text, and RTL.
      </Text>
      <div className="mt-8">
        <SeekerPricingGallery />
      </div>
    </main>
  )
}
