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
  pending: 'En attente', confirmed: 'Confirmee', active: 'Active',
  completed: 'Terminee', cancelled: 'Annulee', refunded: 'Remboursee',
}

export default async function PaymentsAdminPage() {
  const supabase = createSupabaseServerClient()

  // Fetch all non-cancelled bookings for revenue calculation
  const { data: allBookings } = await supabase
    .from('bookings')
    .select('id, total_price, platform_fee, host_payout, status, created_at, spot_id, driver_id')
    .order('created_at', { ascending: false })

  const validBookings = (allBookings ?? []).filter(
    (b) => b.status !== 'cancelled' && b.status !== 'refunded',
  )

  const totalRevenue = validBookings.reduce((sum, b) => sum + Number(b.platform_fee ?? 0), 0)
  const totalVolume = validBookings.reduce((sum, b) => sum + Number(b.total_price ?? 0), 0)
  const totalHostPayouts = validBookings.reduce((sum, b) => sum + Number(b.host_payout ?? 0), 0)

  // Revenue by month (last 6 months)
  const now = new Date()
  const monthlyRevenue: { month: string; revenue: number; volume: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    const label = d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
    const monthBookings = validBookings.filter((b) => {
      const created = new Date(b.created_at)
      return created >= d && created <= monthEnd
    })
    monthlyRevenue.push({
      month: label,
      revenue: monthBookings.reduce((sum, b) => sum + Number(b.platform_fee ?? 0), 0),
      volume: monthBookings.reduce((sum, b) => sum + Number(b.total_price ?? 0), 0),
    })
  }

  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.volume), 1)

  // Recent transactions (last 50)
  const recentBookings = (allBookings ?? []).slice(0, 50)
  const driverIds = Array.from(new Set(recentBookings.map((b) => b.driver_id).filter(Boolean)))
  const spotIds = Array.from(new Set(recentBookings.map((b) => b.spot_id).filter(Boolean)))

  const [{ data: drivers }, { data: spots }] = await Promise.all([
    driverIds.length > 0
      ? supabase.from('users').select('id, full_name').in('id', driverIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    spotIds.length > 0
      ? supabase.from('spots').select('id, title').in('id', spotIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ])

  const driverMap = new Map((drivers ?? []).map((d) => [d.id, d.full_name]))
  const spotMap = new Map((spots ?? []).map((s) => [s.id, s.title]))

  function formatDate(d: string) {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
    }).format(new Date(d))
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-xl px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Paiements</h1>
            <p className="text-sm text-gray-400">Revenus et transactions de la plateforme</p>
          </div>
        </header>
        <div className="p-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-5 mb-8">
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-5">
              <p className="text-xs font-medium text-gray-500">Revenus Plateforme</p>
              <p className="mt-2 text-3xl font-extrabold text-[#1A1A2E]">
                {totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} EUR
              </p>
              <p className="mt-1 text-xs text-gray-400">Commission totale percue</p>
            </div>
            <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5">
              <p className="text-xs font-medium text-gray-500">Volume Total</p>
              <p className="mt-2 text-3xl font-extrabold text-[#1A1A2E]">
                {totalVolume.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} EUR
              </p>
              <p className="mt-1 text-xs text-gray-400">Montant total des reservations</p>
            </div>
            <div className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-5">
              <p className="text-xs font-medium text-gray-500">Reversements Hotes</p>
              <p className="mt-2 text-3xl font-extrabold text-[#1A1A2E]">
                {totalHostPayouts.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} EUR
              </p>
              <p className="mt-1 text-xs text-gray-400">Total reverse aux hotes</p>
            </div>
          </div>

          {/* Monthly Revenue Chart */}
          <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-[#1A1A2E]">Revenus par mois (6 derniers mois)</h2>
            <div className="flex items-end gap-3" style={{ height: '180px' }}>
              {monthlyRevenue.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-[#0540FF]">
                      {m.revenue > 0 ? `${m.revenue.toFixed(0)} EUR` : ''}
                    </span>
                    <div
                      className="w-full rounded-t-lg bg-[#0540FF]/80 transition-all"
                      style={{
                        height: `${Math.max((m.volume / maxRevenue) * 140, 4)}px`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{m.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-[#1A1A2E]">Transactions recentes</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Conducteur</th>
                  <th className="px-5 py-3 text-left">Place</th>
                  <th className="px-5 py-3 text-left">Statut</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-right">Commission</th>
                  <th className="px-5 py-3 text-right">Reversement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-600">{formatDate(b.created_at)}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {driverMap.get(b.driver_id) ?? 'Inconnu'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 truncate max-w-[180px]">
                      {spotMap.get(b.spot_id) ?? '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[b.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-gray-900">
                      {Number(b.total_price).toFixed(2)} EUR
                    </td>
                    <td className="px-5 py-3.5 text-right text-[#10B981] font-medium">
                      {Number(b.platform_fee ?? 0).toFixed(2)} EUR
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-600">
                      {Number(b.host_payout ?? 0).toFixed(2)} EUR
                    </td>
                  </tr>
                ))}
                {recentBookings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                      Aucune transaction
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
