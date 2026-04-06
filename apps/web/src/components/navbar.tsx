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
import { Search, Menu, Bell, Globe, Heart, User as UserIcon, LayoutDashboard, PlusCircle, LogOut, Home, Calendar, ChevronRight, X, MapPin, ListChecks } from 'lucide-react'

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

  // Fetch DB user role (only when logged in)
  const { data: dbUser } = api.users.me.useQuery(undefined, { enabled: !!user })
  const isHost = dbUser?.role === 'host' || dbUser?.role === 'both' || dbUser?.role === 'admin'

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
                      ...(isHost ? [
                        { href: '/host', label: 'Tableau de bord hote', icon: LayoutDashboard },
                        { href: '/host/listings/new', label: 'Creer une annonce', icon: PlusCircle },
                      ] : [
                        { href: '/host', label: 'Devenir hote', icon: Home },
                      ]),
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

      {/* Mobile menu overlay — modernized */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%', transition: { duration: 0.2 } }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex-shrink-0 bg-gradient-to-b from-gray-50 to-white px-6 pt-5 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-gray-900">Menu</span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <X className="h-4.5 w-4.5 text-gray-600" strokeWidth={2} />
                  </motion.button>
                </div>
                {user && (
                  <div className="flex items-center gap-3 rounded-2xl bg-white border border-gray-100 p-3 shadow-sm">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />
                      <AvatarFallback className="bg-[#0540FF] text-sm font-bold text-white">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">Connecte en tant que</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.user_metadata?.full_name || user.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-300">Navigation</p>
                <nav className="space-y-0.5">
                  {[
                    { href: '/map', label: 'Explorer la carte', icon: MapPin },
                    { href: '/host', label: 'Louer ma place', icon: Home },
                  ].map(({ href, label, icon: Icon }, i) => {
                    const active = pathname === href
                    return (
                      <motion.div key={href} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                        <Link href={href} onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-xl px-3 py-3.5 text-sm font-medium transition-colors',
                            active ? 'bg-[#0540FF]/5 text-[#0540FF]' : 'text-gray-700 hover:bg-gray-50'
                          )}>
                          <Icon className={cn('h-5 w-5', active ? 'text-[#0540FF]' : 'text-gray-400')} strokeWidth={1.8} />
                          <span className="flex-1">{label}</span>
                          <ChevronRight className="h-4 w-4 text-gray-300" />
                        </Link>
                      </motion.div>
                    )
                  })}
                </nav>

                {user && (
                  <>
                    <p className="px-3 mt-6 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-300">Mon compte</p>
                    <nav className="space-y-0.5">
                      {[
                        { href: '/dashboard', label: 'Mes reservations', icon: Calendar },
                        { href: '/wishlists', label: 'Mes favoris', icon: Heart },
                        { href: '/profile', label: 'Mon profil', icon: UserIcon },
                      ].map(({ href, label, icon: Icon }, i) => {
                        const active = pathname === href || pathname.startsWith(href + '/')
                        return (
                          <motion.div key={href} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * (i + 2) }}>
                            <Link href={href} onClick={() => setMobileMenuOpen(false)}
                              className={cn(
                                'flex items-center gap-3 rounded-xl px-3 py-3.5 text-sm font-medium transition-colors',
                                active ? 'bg-[#0540FF]/5 text-[#0540FF]' : 'text-gray-700 hover:bg-gray-50'
                              )}>
                              <Icon className={cn('h-5 w-5', active ? 'text-[#0540FF]' : 'text-gray-400')} strokeWidth={1.8} />
                              <span className="flex-1">{label}</span>
                              <ChevronRight className="h-4 w-4 text-gray-300" />
                            </Link>
                          </motion.div>
                        )
                      })}
                    </nav>
                  </>
                )}

                {user && isHost && (
                  <>
                    <p className="px-3 mt-6 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-300">Hote</p>
                    <nav className="space-y-0.5">
                      {[
                        { href: '/host', label: 'Tableau de bord', icon: LayoutDashboard },
                        { href: '/host/listings', label: 'Mes annonces', icon: ListChecks },
                        { href: '/host/planning', label: 'Planning', icon: Calendar },
                      ].map(({ href, label, icon: Icon }, i) => {
                        const active = pathname === href
                        return (
                          <motion.div key={`host-${href}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * (i + 5) }}>
                            <Link href={href} onClick={() => setMobileMenuOpen(false)}
                              className={cn(
                                'flex items-center gap-3 rounded-xl px-3 py-3.5 text-sm font-medium transition-colors',
                                active ? 'bg-[#0540FF]/5 text-[#0540FF]' : 'text-gray-700 hover:bg-gray-50'
                              )}>
                              <Icon className={cn('h-5 w-5', active ? 'text-[#0540FF]' : 'text-gray-400')} strokeWidth={1.8} />
                              <span className="flex-1">{label}</span>
                              <ChevronRight className="h-4 w-4 text-gray-300" />
                            </Link>
                          </motion.div>
                        )
                      })}
                    </nav>
                  </>
                )}
              </div>

              {/* Bottom */}
              <div className="flex-shrink-0 border-t border-gray-100 px-6 py-4">
                {user ? (
                  <>
                    <button
                      onClick={() => { handleSignOut(); setMobileMenuOpen(false) }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-5 w-5" strokeWidth={1.8} />
                      Se deconnecter
                    </button>
                    <p className="mt-3 text-center text-[10px] text-gray-300">v1.0 · Nice, France</p>
                  </>
                ) : (
                  <div className="space-y-3">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center rounded-xl bg-[#0540FF] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[#0435D2] transition-colors">
                      S&apos;inscrire
                    </Link>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center rounded-xl border border-gray-200 px-4 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
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
