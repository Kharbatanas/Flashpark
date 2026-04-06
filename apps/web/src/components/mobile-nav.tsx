'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Heart, ParkingCircle, Calendar, User } from 'lucide-react'
import { createSupabaseBrowserClient } from '../lib/supabase/client'
import { cn } from '@/lib/utils'

interface Tab {
  label: string
  icon: React.ElementType
  href: string
  authRequired: boolean
  center?: boolean
}

const TABS: Tab[] = [
  { label: 'Explorer',      icon: Search,        href: '/map',       authRequired: false },
  { label: 'Favoris',       icon: Heart,         href: '/map',       authRequired: false },
  { label: 'Reserver',      icon: ParkingCircle, href: '/map',       authRequired: false, center: true },
  { label: 'Reservations',  icon: Calendar,      href: '/dashboard', authRequired: true },
  { label: 'Profil',        icon: User,          href: '/profile',   authRequired: true },
]

export function MobileNav() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-white/90 backdrop-blur-xl border-t border-gray-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-full items-center justify-around px-2">
        {TABS.map((tab) => {
          const resolvedHref = tab.authRequired && !isLoggedIn ? '/login' : tab.href
          const isActive = pathname === tab.href && !(tab.authRequired && !isLoggedIn)

          if (tab.center) {
            return <CenterTab key={tab.label} tab={tab} href={resolvedHref} />
          }

          return <RegularTab key={tab.label} tab={tab} href={resolvedHref} isActive={isActive} />
        })}
      </div>
    </nav>
  )
}

function RegularTab({ tab, href, isActive }: { tab: Tab; href: string; isActive: boolean }) {
  const Icon = tab.icon
  return (
    <Link href={href} className="flex-1">
      <motion.div whileTap={{ scale: 0.9 }} className="flex flex-col items-center justify-center gap-0.5 py-1">
        <Icon
          className={cn('h-5 w-5 transition-colors', isActive ? 'text-[#0540FF]' : 'text-gray-400')}
          strokeWidth={isActive ? 2.2 : 1.8}
        />
        <span className={cn('text-[10px] font-medium transition-colors leading-none', isActive ? 'text-[#0540FF]' : 'text-gray-400')}>
          {tab.label}
        </span>
        {isActive && (
          <motion.div
            layoutId="mobile-nav-dot"
            className="mt-0.5 h-1 w-1 rounded-full bg-[#0540FF]"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
      </motion.div>
    </Link>
  )
}

function CenterTab({ tab, href }: { tab: Tab; href: string }) {
  const Icon = tab.icon
  return (
    <Link href={href} className="flex-1 flex justify-center">
      <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-0.5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0540FF] shadow-lg shadow-[#0540FF]/30 -mt-4">
          <Icon className="h-6 w-6 text-white" strokeWidth={2} />
        </div>
        <span className="text-[10px] font-medium text-[#0540FF] leading-none mt-0.5">{tab.label}</span>
      </motion.div>
    </Link>
  )
}
