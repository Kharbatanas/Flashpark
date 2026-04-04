import { Navbar } from '../../components/navbar'
import { TRPCProvider } from '../../lib/trpc/client'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <Navbar />
      {children}
    </TRPCProvider>
  )
}
