'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createSupabaseBrowserClient } from '../lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../lib/trpc/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'

function NotificationBell() {
  const { data } = api.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  })
  const count = data?.count ?? 0

  return (
    <Link href="/notifications" className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
      <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const isHome = pathname === '/'

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initials = user?.user_metadata?.full_name
    ? (user.user_metadata.full_name as string).split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U'
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined

  const transparent = isHome && !scrolled

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        transparent
          ? 'bg-transparent border-transparent'
          : 'bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className={cn(
            'text-xl font-extrabold tracking-tight',
            transparent ? 'text-white' : 'text-[#1A1A2E]'
          )}
        >
          <motion.span whileHover={{ scale: 1.05 }} className="inline-block">
            Flash<span className="text-[#0540FF]">park</span>
          </motion.span>
        </Link>

        {/* Center search pill — shown on non-home or scrolled */}
        <AnimatePresence>
          {!transparent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Link
                href="/map"
                className="hidden md:flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="text-sm font-medium text-gray-700">Où se garer ?</span>
                <span className="h-4 w-px bg-gray-200" />
                <span className="text-sm text-gray-400">Nice · Maintenant</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0540FF]">
                  <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right */}
        <div className="flex items-center gap-2">
          <Link
            href="/host"
            className={cn(
              'hidden md:block rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              transparent
                ? 'text-white hover:bg-white/10'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            Louer ma place
          </Link>

          {user && <NotificationBell />}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2.5 rounded-full border border-gray-200 bg-white p-1 pr-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <svg className="ml-1 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />
                    <AvatarFallback className="bg-[#0540FF] text-xs font-bold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </motion.button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-xs font-medium text-gray-400">Connecté en tant que</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-800 truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {[
                    { href: '/profile', label: 'Mon profil' },
                    { href: '/dashboard', label: 'Mes réservations' },
                    { href: '/host', label: 'Tableau de bord hôte' },
                    { href: '/host/listings/new', label: 'Créer une annonce' },
                  ].map(({ href, label }) => (
                    <DropdownMenuItem key={href} asChild>
                      <Link href={href} className="w-full cursor-pointer">
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500 focus:text-red-500 focus:bg-red-50"
                  onSelect={handleSignOut}
                >
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                asChild
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold',
                  transparent
                    ? 'text-white hover:bg-white/10 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Link href="/login">Connexion</Link>
              </Button>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button asChild className="rounded-full bg-[#0540FF] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm">
                  <Link href="/login">S&apos;inscrire</Link>
                </Button>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  )
}
