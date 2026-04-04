import Link from 'next/link'
import { createSupabaseServerClient } from '../../lib/supabase/server'
import { Sidebar } from '../../components/sidebar'

export const dynamic = 'force-dynamic'

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  active:    'bg-emerald-50 text-emerald-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-50 text-red-600',
  refunded:  'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', confirmed: 'Confirmée', active: 'Active',
  completed: 'Terminée', cancelled: 'Annulée', refunded: 'Remboursée',
}

const STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'active', label: 'Actives' },
  { value: 'completed', label: 'Terminées' },
  { value: 'cancelled', label: 'Annulées' },
]

export default async function BookingsAdminPage({ searchParams }: { searchParams: { page?: string; status?: string } }) {
  const supabase = createSupabaseServerClient()
  const page = Math.max(1, Number(searchParams.page ?? 1))
  const status = searchParams.status ?? ''
  const pageSize = 30
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('bookings')
    .select('id, spot_id, driver_id, start_time, end_time, total_price, platform_fee, host_payout, status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)

  const { data: bookings, count } = await query
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  // Fetch spot titles for display
  const spotIds = [...new Set((bookings ?? []).map((b) => b.spot_id).filter(Boolean))]
  const spotMap: Record<string, string> = {}
  if (spotIds.length > 0) {
    const { data: spots } = await supabase.from('spots').select('id, title').in('id', spotIds)
    spots?.forEach((s) => { spotMap[s.id] = s.title })
  }

  function formatDateTime(d: string) {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    }).format(new Date(d))
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-xl px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Réservations</h1>
            <p className="text-sm text-gray-400">Toutes les réservations de la plateforme</p>
          </div>
        </header>
        <div className="p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500">{count ?? 0} réservation(s)</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((f) => (
                <Link
                  key={f.value}
                  href={f.value ? `/bookings?status=${f.value}` : '/bookings'}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    status === f.value
                      ? 'bg-[#0540FF] text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {f.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-5 py-3 text-left">Réf</th>
                  <th className="px-5 py-3 text-left">Parking</th>
                  <th className="px-5 py-3 text-left">Arrivée</th>
                  <th className="px-5 py-3 text-left">Départ</th>
                  <th className="px-5 py-3 text-left">Statut</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-right">Plateforme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings?.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{b.id.slice(0, 8)}</td>
                    <td className="px-5 py-3.5 text-gray-700 font-medium truncate max-w-[180px]">
                      {spotMap[b.spot_id] ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{formatDateTime(b.start_time)}</td>
                    <td className="px-5 py-3.5 text-gray-600">{formatDateTime(b.end_time)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[b.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-gray-900">
                      {Number(b.total_price).toFixed(2)} €
                    </td>
                    <td className="px-5 py-3.5 text-right text-[#10B981] font-medium">
                      {Number(b.platform_fee).toFixed(2)} €
                    </td>
                  </tr>
                ))}
                {!bookings?.length && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                      Aucune réservation
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2">
              {page > 1 && (
                <Link href={`/bookings?${status ? `status=${status}&` : ''}page=${page - 1}`}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  ← Précédent
                </Link>
              )}
              <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
              {page < totalPages && (
                <Link href={`/bookings?${status ? `status=${status}&` : ''}page=${page + 1}`}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Suivant →
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
