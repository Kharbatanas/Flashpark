import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '../../../lib/supabase/server'
import { SpotActions } from './spot-actions'
import { Sidebar } from '../../../components/sidebar'

export const dynamic = 'force-dynamic'

const TYPE_LABELS: Record<string, string> = {
  outdoor: 'Extérieur', indoor: 'Intérieur', garage: 'Garage',
  covered: 'Couvert', underground: 'Souterrain',
}

export default async function SpotDetailAdminPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient()

  const { data: spot } = await supabase
    .from('spots')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!spot) notFound()

  const { data: host } = await supabase
    .from('users')
    .select('email, full_name, role')
    .eq('id', spot.host_id)
    .single()

  const { data: bookings, count: bookingCount } = await supabase
    .from('bookings')
    .select('id, status, total_price, created_at', { count: 'exact' })
    .eq('spot_id', spot.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const totalRevenue = bookings
    ?.filter((b) => b.status !== 'cancelled' && b.status !== 'refunded')
    .reduce((sum, b) => sum + Number(b.total_price), 0) ?? 0

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-xl px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Détail de la place</h1>
            <p className="text-sm text-gray-400">{spot.title}</p>
          </div>
          <Link href="/spots" className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            ← Retour aux annonces
          </Link>
        </header>
        <div className="p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{spot.title}</h2>
              <p className="mt-1 text-sm text-gray-500">{spot.address}, {spot.city}</p>
            </div>
            <SpotActions spotId={spot.id} currentStatus={spot.status} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Left column */}
            <div className="space-y-4 lg:col-span-2">
              {/* Details */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-semibold text-gray-900">Détails</h2>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['Type', TYPE_LABELS[spot.type] ?? spot.type],
                    ['Prix/h', `${Number(spot.price_per_hour).toFixed(2)} €`],
                    ['Prix/j', spot.price_per_day ? `${Number(spot.price_per_day).toFixed(2)} €` : '—'],
                    ['Smart Gate', spot.has_smart_gate ? 'Oui' : 'Non'],
                    ['Réservation inst.', spot.instant_book ? 'Oui' : 'Non'],
                    ['Note', spot.rating ? `${Number(spot.rating).toFixed(1)} (${spot.review_count})` : '—'],
                    ['Hauteur max', spot.max_vehicle_height ? `${Number(spot.max_vehicle_height).toFixed(1)} m` : '—'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</dt>
                      <dd className="mt-0.5 font-medium text-gray-900">{value}</dd>
                    </div>
                  ))}
                </dl>
                {spot.description && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">Description</p>
                    <p className="text-sm text-gray-600">{spot.description}</p>
                  </div>
                )}
                {Array.isArray(spot.amenities) && spot.amenities.length > 0 && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">Équipements</p>
                    <div className="flex flex-wrap gap-2">
                      {spot.amenities.map((a: string) => (
                        <span key={a} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Photos */}
              {Array.isArray(spot.photos) && spot.photos.length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 font-semibold text-gray-900">Photos ({spot.photos.length})</h2>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {spot.photos.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt={`Photo ${i + 1}`}
                          className="h-32 w-full rounded-xl object-cover hover:opacity-90 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent bookings */}
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
                  <h2 className="font-semibold text-gray-900">Réservations récentes</h2>
                  <span className="text-xs text-gray-400">{bookingCount ?? 0} au total</span>
                </div>
                {bookings?.length ? (
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-400 uppercase tracking-wide">
                      <tr>
                        <th className="px-5 py-2.5 text-left">ID</th>
                        <th className="px-5 py-2.5 text-left">Statut</th>
                        <th className="px-5 py-2.5 text-right">Total</th>
                        <th className="px-5 py-2.5 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-gray-50/50">
                          <td className="px-5 py-2.5 font-mono text-gray-400">{b.id.slice(0, 8)}</td>
                          <td className="px-5 py-2.5">{b.status}</td>
                          <td className="px-5 py-2.5 text-right font-medium">{Number(b.total_price).toFixed(2)} €</td>
                          <td className="px-5 py-2.5 text-gray-400">{new Date(b.created_at).toLocaleDateString('fr-FR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="px-5 py-8 text-center text-sm text-gray-400">Aucune réservation</p>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Host */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-3 font-semibold text-gray-900">Hôte</h2>
                <p className="text-sm font-medium text-gray-900">{host?.full_name ?? '—'}</p>
                <p className="text-xs text-gray-500">{host?.email}</p>
                <p className="mt-1 text-xs text-gray-400">{host?.role}</p>
              </div>

              {/* Revenue */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-3 font-semibold text-gray-900">Revenus générés</h2>
                <p className="text-2xl font-extrabold text-[#10B981]">
                  {totalRevenue.toFixed(2).replace('.', ',')} €
                </p>
                <p className="mt-1 text-xs text-gray-400">sur {bookingCount ?? 0} réservation(s)</p>
              </div>

              {/* Coordinates */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-3 font-semibold text-gray-900">Coordonnées GPS</h2>
                <p className="text-sm font-mono text-gray-600">{Number(spot.latitude).toFixed(6)}</p>
                <p className="text-sm font-mono text-gray-600">{Number(spot.longitude).toFixed(6)}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
