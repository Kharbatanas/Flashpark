import { Navbar } from '../../components/navbar'
import { TRPCProvider } from '../../lib/trpc/client'
import { MobileNav } from '../../components/mobile-nav'
import { ReviewGateModal } from '../../components/review-gate-modal'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <Navbar />
      <div className="pb-16 md:pb-0">{children}</div>
      <MobileNav />
      <ReviewGateModal />
    </TRPCProvider>
  )
}
