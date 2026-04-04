import Link from 'next/link'
import { createSupabaseServerClient } from '../../lib/supabase/server'
import { Sidebar } from '../../components/sidebar'

export const dynamic = 'force-dynamic'

interface SearchParams {
  status?: string
  page?: string
}

const STATUS_OPTS = [
  { value: '', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'inactive', label: 'Inactifs' },
  { value: 'pending_review', label: 'En révision' },
]

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-500',
  pending_review: 'bg-amber-50 text-amber-700',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Actif', inactive: 'Inactif', pending_review: 'En révision',
}

const TYPE_LABELS: Record<string, string> = {
  outdoor: 'Extérieur', indoor: 'Intérieur', garage: 'Garage',
  covered: 'Couvert', underground: 'Souterrain',
}

export default async function SpotsAdminPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createSupabaseServerClient()
  const status = searchParams.status ?? ''
  const page = Math.max(1, Number(searchParams.page ?? 1))
  const pageSize = 25
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('spots')
    .select('id, title, address, city, price_per_hour, type, status, rating, review_count, has_smart_gate, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)

  const { data: spots, count } = await query
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-xl px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Places</h1>
            <p className="text-sm text-gray-400">Gestion des annonces de parking</p>
          </div>
        </header>
        <div className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">{count ?? 0} annonce(s)</p>
            <div className="flex gap-2">
              {STATUS_OPTS.map((opt) => (
                <Link
                  key={opt.value}
                  href={opt.value ? `/spots?status=${opt.value}` : '/spots'}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    status === opt.value
                      ? 'bg-[#0540FF] text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-5 py-3 text-left">Titre</th>
                  <th className="px-5 py-3 text-left">Ville</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left">Statut</th>
                  <th className="px-5 py-3 text-right">Prix/h</th>
                  <th className="px-5 py-3 text-right">Note</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {spots?.map((spot) => (
                  <tr key={spot.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 line-clamp-1">{spot.title}</span>
                        {spot.has_smart_gate && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">⚡</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate max-w-xs">{spot.address}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{spot.city}</td>
                    <td className="px-5 py-3.5 text-gray-600">{TYPE_LABELS[spot.type] ?? spot.type}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[spot.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABELS[spot.status] ?? spot.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-gray-900">
                      {Number(spot.price_per_hour).toFixed(2)} €
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-600">
                      {spot.rating ? `${Number(spot.rating).toFixed(1)} (${spot.review_count})` : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/spots/${spot.id}`}
                        className="text-xs font-medium text-[#0540FF] hover:underline"
                      >
                        Gérer
                      </Link>
                    </td>
                  </tr>
                ))}
                {!spots?.length && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                      Aucune annonce
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2">
              {page > 1 && (
                <Link href={`/spots?${status ? `status=${status}&` : ''}page=${page - 1}`}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  ← Précédent
                </Link>
              )}
              <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
              {page < totalPages && (
                <Link href={`/spots?${status ? `status=${status}&` : ''}page=${page + 1}`}
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
