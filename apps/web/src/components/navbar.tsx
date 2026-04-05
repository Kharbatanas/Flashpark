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
import { Search, Menu, Bell, Globe, Heart, User as UserIcon, LayoutDashboard, PlusCircle, LogOut, Home, Calendar } from 'lucide-react'

function NotificationBell() {
  const { data } = api.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  })
  const count = data?.count ?? 0

  return (
    <Link href="/notifications" className="relative p-2.5 rounded-full hover:bg-gray-100 transition-colors">
      <Bell className="h-5 w-5 text-gray-600" strokeWidth={1.8} />
      {count > 0 && (
        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF385C] text-[10px] font-bold text-white ring-2 ring-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-300',
          transparent
            ? 'bg-transparent'
            : 'bg-white border-b border-gray-200 shadow-sm'
        )}
      >
        <div className="mx-auto flex h-[72px] max-w-[1760px] items-center justify-between px-6 lg:px-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 shrink-0">
            <motion.div whileHover={{ scale: 1.03 }} className="flex items-center gap-1.5">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                transparent ? "bg-white" : "bg-[#0540FF]"
              )}>
                <span className={cn("text-base font-black", transparent ? "text-[#0540FF]" : "text-white")}>P</span>
              </div>
              <span className={cn(
                'text-xl font-bold tracking-tight',
                transparent ? 'text-white' : 'text-gray-900'
              )}>
                flash<span className="text-[#0540FF]">park</span>
              </span>
            </motion.div>
          </Link>

          {/* Center search pill — Airbnb style */}
          <AnimatePresence>
            {!transparent && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -8 }}
                transition={{ duration: 0.25 }}
                className="hidden md:block"
              >
                <Link
                  href="/map"
                  className="flex items-center rounded-full border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-1 px-5 py-2.5">
                    <span className="text-sm font-semibold text-gray-900">Destination</span>
                  </div>
                  <span className="h-6 w-px bg-gray-200" />
                  <div className="flex items-center gap-1 px-5 py-2.5">
                    <span className="text-sm font-semibold text-gray-900">Date</span>
                  </div>
                  <span className="h-6 w-px bg-gray-200" />
                  <div className="flex items-center gap-1 pl-5 pr-2 py-1.5">
                    <span className="text-sm text-gray-400">Type de place</span>
                    <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#0540FF]">
                      <Search className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            <Link
              href="/host"
              className={cn(
                'hidden md:block rounded-full px-4 py-2.5 text-sm font-semibold transition-colors',
                transparent
                  ? 'text-white hover:bg-white/10'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              Louer ma place
            </Link>

            <button className={cn(
              "hidden md:flex p-2.5 rounded-full transition-colors",
              transparent ? "hover:bg-white/10" : "hover:bg-gray-100"
            )}>
              <Globe className={cn("h-4 w-4", transparent ? "text-white" : "text-gray-600")} strokeWidth={2} />
            </button>

            {user && <NotificationBell />}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2.5 rounded-full border border-gray-200 bg-white p-1.5 pl-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <Menu className="h-4 w-4 text-gray-600" strokeWidth={2} />
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />
                      <AvatarFallback className="bg-[#0540FF] text-xs font-bold text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </motion.button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-60 rounded-xl p-1">
                  <DropdownMenuLabel className="px-3 py-2">
                    <p className="text-xs text-gray-400">Connecte en tant que</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-900 truncate">{user.user_metadata?.full_name || user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    {[
                      { href: '/profile', label: 'Mon profil', icon: UserIcon },
                      { href: '/dashboard', label: 'Mes reservations', icon: Calendar },
                      { href: '/wishlists', label: 'Mes favoris', icon: Heart },
                      { href: '/host', label: 'Tableau de bord hote', icon: LayoutDashboard },
                      { href: '/host/listings/new', label: 'Creer une annonce', icon: PlusCircle },
                    ].map(({ href, label, icon: Icon }) => (
                      <DropdownMenuItem key={href} asChild>
                        <Link href={href} className="flex items-center gap-3 w-full cursor-pointer px-3 py-2.5">
                          <Icon className="h-4 w-4 text-gray-400" strokeWidth={1.8} />
                          <span>{label}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-3 px-3 py-2.5 text-red-500 focus:text-red-500 focus:bg-red-50 cursor-pointer"
                    onSelect={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.8} />
                    <span>Se deconnecter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  asChild
                  className={cn(
                    'rounded-full px-4 py-2.5 text-sm font-semibold',
                    transparent
                      ? 'text-white hover:bg-white/10 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Link href="/login">Connexion</Link>
                </Button>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button asChild className="rounded-full bg-[#0540FF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0435D2] shadow-sm">
                    <Link href="/login">S&apos;inscrire</Link>
                  </Button>
                </motion.div>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className={cn("md:hidden p-2 rounded-full", transparent ? "hover:bg-white/10" : "hover:bg-gray-100")}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className={cn("h-5 w-5", transparent ? "text-white" : "text-gray-700")} />
            </button>
          </div>
        </div>

        {/* Mobile search bar — compact, visible on scroll */}
        <AnimatePresence>
          {!transparent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-100 px-4 pb-3"
            >
              <Link href="/map" className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
                <Search className="h-4 w-4 text-gray-400" strokeWidth={2} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Ou se garer ?</p>
                  <p className="text-xs text-gray-400">N&apos;importe ou · N&apos;importe quand</p>
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-lg font-bold text-gray-900">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                  <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="space-y-1">
                {[
                  { href: '/map', label: 'Explorer la carte', icon: Search },
                  { href: '/host', label: 'Louer ma place', icon: Home },
                  ...(user ? [
                    { href: '/dashboard', label: 'Mes reservations', icon: Calendar },
                    { href: '/wishlists', label: 'Mes favoris', icon: Heart },
                    { href: '/profile', label: 'Mon profil', icon: UserIcon },
                  ] : []),
                ].map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Icon className="h-5 w-5 text-gray-400" strokeWidth={1.8} />
                    {label}
                  </Link>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-100">
                {user ? (
                  <button
                    onClick={() => { handleSignOut(); setMobileMenuOpen(false) }}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full"
                  >
                    <LogOut className="h-5 w-5" strokeWidth={1.8} />
                    Se deconnecter
                  </button>
                ) : (
                  <div className="space-y-3">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center rounded-xl bg-[#0540FF] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0435D2] transition-colors">
                      S&apos;inscrire
                    </Link>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                      Connexion
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
