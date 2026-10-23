import AnnouncementBar from "@/components/layout/AnnouncementBar"
import Footer from "@/components/layout/Footer"
import Navbar from "@/components/layout/Navbar"
import { SiteHeader } from "@/components/layout/SiteHeader"
import { getRealCounts } from "@/lib/social-proof"

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const counts = await getRealCounts()
  return (
    <div className="min-h-screen bg-surface text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-toast focus:rounded-control focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink"
      >
        Skip to main content
      </a>
      <SiteHeader>
        <AnnouncementBar signups={counts.signups} />
        <Navbar />
      </SiteHeader>
      {children}
      <Footer signups={counts.signups} />
    </div>
  )
}
