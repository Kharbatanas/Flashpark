import Link from 'next/link'
import { createSupabaseServerClient } from '../lib/supabase/server'
import { Sidebar } from '../components/sidebar'

export const dynamic = 'force-dynamic'

async function getStats() {
  const supabase = createSupabaseServerClient()

  const results = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('spots').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('spots').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase
      .from('bookings')
      .select('id, total_price, status, created_at, spot_id, driver_id')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('spots')
      .select('id, title, rating, review_count')
      .eq('status', 'active')
      .order('review_count', { ascending: false })
      .limit(3),
    supabase.from('users').select('*', { count: 'exact', head: true }).or('role.eq.driver,role.eq.both'),
    supabase.from('users').select('*', { count: 'exact', head: true }).or('role.eq.host,role.eq.both'),
  ])

  const usersCount = results[0].count
  const spotsCount = results[1].count
  const bookingsCount = results[2].count
  const activeSpotsCount = results[3].count
  const recentBookings = results[4].data
  const topSpots = results[5].data
  const driversCount = results[6].count
  const hostsCount = results[7].count

  // Calculate total revenue
  const { data: allBookings } = await supabase
    .from('bookings')
    .select('total_price, status')
  const totalRevenue = (allBookings ?? [])
    .filter((b) => b.status !== 'cancelled' && b.status !== 'refunded')
    .reduce((sum, b) => sum + Number(b.total_price), 0)

  // Get driver/host names for recent bookings
  let bookingDetails: Array<{
    id: string; total_price: string; status: string; created_at: string
    driverName: string; spotTitle: string
  }> = []

  if (recentBookings && recentBookings.length > 0) {
    const driverIds = Array.from(new Set(recentBookings.map((b) => b.driver_id).filter(Boolean)))
    const spotIds = Array.from(new Set(recentBookings.map((b) => b.spot_id).filter(Boolean)))

    const [{ data: drivers }, { data: spots }] = driverIds.length > 0 || spotIds.length > 0
      ? await Promise.all([
          driverIds.length > 0
            ? supabase.from('users').select('id, full_name').in('id', driverIds)
            : Promise.resolve({ data: [] }),
          spotIds.length > 0
            ? supabase.from('spots').select('id, title').in('id', spotIds)
            : Promise.resolve({ data: [] }),
        ])
      : [{ data: [] }, { data: [] }]

    const driverMap = new Map((drivers ?? []).map((d) => [d.id, d.full_name]))
    const spotMap = new Map((spots ?? []).map((s) => [s.id, s.title]))

    bookingDetails = recentBookings.map((b) => ({
      id: b.id,
      total_price: b.total_price,
      status: b.status,
      created_at: b.created_at,
      driverName: driverMap.get(b.driver_id) ?? 'Inconnu',
      spotTitle: spotMap.get(b.spot_id) ?? 'Parking',
    }))
  }

  return {
    usersCount: usersCount ?? 0,
    spotsCount: spotsCount ?? 0,
    bookingsCount: bookingsCount ?? 0,
    activeSpotsCount: activeSpotsCount ?? 0,
    totalRevenue,
    recentBookings: bookingDetails,
    topSpots: topSpots ?? [],
    driversCount: driversCount ?? 0,
    hostsCount: hostsCount ?? 0,
  }
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'pending',   color: 'text-amber-600', bg: 'bg-amber-50' },
  confirmed: { label: 'confirmed', color: 'text-blue-600',  bg: 'bg-blue-50' },
  active:    { label: 'active',    color: 'text-emerald-600', bg: 'bg-emerald-50' },
  completed: { label: 'completed', color: 'text-gray-500',  bg: 'bg-gray-100' },
  cancelled: { label: 'cancelled', color: 'text-red-500',   bg: 'bg-red-50' },
  refunded:  { label: 'refunded',  color: 'text-gray-400',  bg: 'bg-gray-50' },
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins}min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Il y a ${hrs}h`
  return `Il y a ${Math.floor(hrs / 24)}j`
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const KPI_CARDS = [
    {
      label: 'Total Utilisateurs',
      value: stats.usersCount.toLocaleString('fr-FR'),
      trend: '+12.5%',
      icon: '👥',
      borderColor: 'border-blue-200',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
    },
    {
      label: 'Revenus Total',
      value: `${stats.totalRevenue.toLocaleString('fr-FR')}€`,
      trend: '+23.5%',
      icon: '€',
      borderColor: 'border-emerald-200',
      bgColor: 'bg-emerald-50',
      iconBg: 'bg-emerald-100',
    },
    {
      label: 'Réservations',
      value: stats.bookingsCount.toLocaleString('fr-FR'),
      trend: '+18.2%',
      icon: '📋',
      borderColor: 'border-purple-200',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100',
    },
    {
      label: 'Places Actives',
      value: stats.activeSpotsCount.toLocaleString('fr-FR'),
      trend: '+8.4%',
      icon: '📍',
      borderColor: 'border-orange-200',
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-100',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      {/* Main content */}
      <main className="ml-60 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-xl px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Dashboard Admin</h1>
            <p className="text-sm text-gray-400">Vue d&apos;ensemble de la plateforme</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exporter
            </button>
            <Link
              href={process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'}
              target="_blank"
              className="flex items-center gap-2 rounded-lg bg-[#0540FF] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              ← Voir Website
            </Link>
          </div>
        </header>

        <div className="p-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-5 mb-8">
            {KPI_CARDS.map(({ label, value, trend, icon, borderColor, bgColor, iconBg }) => (
              <div key={label} className={`rounded-2xl border-2 ${borderColor} ${bgColor} p-5 relative overflow-hidden`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">{label}</p>
                    <p className="mt-2 text-3xl font-extrabold text-[#1A1A2E]">{value}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
                    <span className="text-xl">{icon}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-emerald-600">↗ {trend}</span>
                  <span className="text-xs text-gray-400">vs mois dernier</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Recent Bookings */}
            <div className="col-span-2 rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 className="font-semibold text-[#1A1A2E]">Réservations Récentes</h2>
                <Link href="/bookings" className="text-sm text-gray-400 hover:text-[#0540FF] transition">
                  Tout voir
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {stats.recentBookings.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-gray-400">Aucune réservation</p>
                ) : (
                  stats.recentBookings.map((b) => {
                    const s = STATUS_STYLE[b.status] ?? STATUS_STYLE.pending
                    return (
                      <div key={b.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0540FF]/10 text-sm font-bold text-[#0540FF]">
                          {b.driverName[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1A1A2E]">{b.driverName}</p>
                          <p className="text-xs text-gray-400">{b.spotTitle} · {timeAgo(b.created_at)}</p>
                        </div>
                        <p className="text-sm font-bold text-[#0540FF]">
                          {Number(b.total_price).toFixed(0)}€
                        </p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.color} ${s.bg}`}>
                          {s.label}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Top Spots */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="font-semibold text-[#1A1A2E]">🏆 Top Hôtes</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {stats.topSpots.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-gray-400">Aucune place</p>
                ) : (
                  stats.topSpots.map((spot) => (
                    <Link key={spot.id} href={`/spots/${spot.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition">
                      <div>
                        <p className="text-sm font-semibold text-[#1A1A2E]">{spot.title}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs text-amber-500">★</span>
                          <span className="text-xs text-gray-500">{spot.rating ? Number(spot.rating).toFixed(1) : '—'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{spot.review_count} résa</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* User Management */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="font-semibold text-[#1A1A2E]">👥 Gestion Utilisateurs</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                  <span className="text-sm text-gray-600">Conducteurs actifs</span>
                  <span className="rounded-lg bg-[#0540FF] px-3 py-1 text-sm font-bold text-white">
                    {stats.driversCount.toLocaleString('fr-FR')}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                  <span className="text-sm text-gray-600">Hôtes actifs</span>
                  <span className="rounded-lg bg-emerald-500 px-3 py-1 text-sm font-bold text-white">
                    {stats.hostsCount.toLocaleString('fr-FR')}
                  </span>
                </div>
                <div className="mt-2 flex gap-3">
                  <Link href="/users" className="flex-1 rounded-xl border border-gray-200 py-2.5 text-center text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                    👤 Valider
                  </Link>
                  <button className="flex-1 rounded-xl border border-gray-200 py-2.5 text-center text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                    🚫 Bloquer
                  </button>
                  <button className="flex-1 rounded-xl border border-gray-200 py-2.5 text-center text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                    ✉️ Email
                  </button>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="font-semibold text-[#1A1A2E]">⚡ État Système</h2>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: 'API', sub: 'Server', status: 'Opérationnel', color: 'bg-emerald-500' },
                  { label: 'Database', sub: '', status: 'Opérationnel', color: 'bg-emerald-500' },
                  { label: 'Payment Gateway', sub: '', status: 'Charge élevée', color: 'bg-amber-500' },
                ].map(({ label, sub, status, color }) => (
                  <div key={label} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200">
                        <span className="text-sm">🖥️</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1A1A2E]">{label}</p>
                        {sub && <p className="text-xs text-gray-400">{sub}</p>}
                      </div>
                    </div>
                    <span className={`rounded-lg ${color} px-3 py-1 text-xs font-semibold text-white`}>
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
