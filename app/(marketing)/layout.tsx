import { SkipLink } from "@/components/a11y/SkipLink"
import Footer from "@/components/layout/Footer"
import Navbar from "@/components/layout/Navbar"
import { SiteHeader } from "@/components/layout/SiteHeader"
import { getRealCounts } from "@/lib/social-proof"

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const counts = await getRealCounts()
  return (
    <div className="min-h-screen bg-surface text-ink">
      <SkipLink />
      <SiteHeader>
        <Navbar />
      </SiteHeader>
      {children}
      <Footer signups={counts.signups} />
    </div>
  )
}
