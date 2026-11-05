import type { Metadata } from "next"
import { PrimitiveGallery } from "@/components/design-system/PrimitiveGallery"
import { ProductGallery } from "@/components/design-system/ProductGallery"

export const metadata: Metadata = {
  title: "Design system — WorkGraph",
  robots: { index: false, follow: false },
}

export default function DesignSystemPage() {
  return (
    <main>
      <PrimitiveGallery />
      <ProductGallery />
    </main>
  )
}
