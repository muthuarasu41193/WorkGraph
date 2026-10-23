import type { Metadata } from "next"
import { StatesGallery } from "@/components/design-system/StatesGallery"
import { Text } from "@/components/ui/text"

export const metadata: Metadata = {
  title: "States — WorkGraph",
  robots: { index: false, follow: false },
}

export default function StatesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Text as="h1" role="heading">States</Text>
      <div className="mt-6">
        <StatesGallery />
      </div>
    </main>
  )
}
