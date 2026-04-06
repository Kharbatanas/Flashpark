'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/users', label: 'Utilisateurs', icon: '👥' },
  { href: '/spots', label: 'Places', icon: '📍' },
  { href: '/bookings', label: 'Réservations', icon: '📋' },
  { href: '/payments', label: 'Paiements', icon: '€' },
  { href: '/reviews', label: 'Avis', icon: '⭐' },
  { href: '/verification', label: 'Vérification', icon: '🛡️' },
  { href: '/intelligence', label: 'Veille Marché', icon: '🕵️' },
  { href: '/support', label: 'Support', icon: '💬' },
  { href: '/settings', label: 'Paramètres', icon: '⚙️' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-gray-100 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0540FF]">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <span className="text-lg font-extrabold text-[#1A1A2E]">FlashPark</span>
            <p className="text-[10px] font-medium text-gray-400 -mt-0.5">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#0540FF] text-white shadow-md shadow-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0540FF]/10">
            <svg className="h-5 w-5 text-[#0540FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1A1A2E] truncate">Admin</p>
            <p className="text-xs text-gray-400 truncate">admin@flashpark.fr</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
