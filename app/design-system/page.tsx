import type { Metadata } from "next"
import { PrimitiveGallery } from "@/components/design-system/PrimitiveGallery"

export const metadata: Metadata = {
  title: "Design system — WorkGraph",
  robots: { index: false, follow: false },
}

export default function DesignSystemPage() {
  return (
    <main>
      <PrimitiveGallery />
    </main>
  )
}
