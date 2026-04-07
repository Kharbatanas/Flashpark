import { createSupabaseServerClient } from '../../lib/supabase/server'
import { Sidebar } from '../../components/sidebar'
import { DisputeActions } from './dispute-actions'

export const dynamic = 'force-dynamic'

const TYPE_LABELS: Record<string, string> = {
  spot_occupied: 'Place occupee',
  spot_not_matching: 'Non conforme',
  access_issue: "Probleme d'acces",
  safety_concern: 'Securite',
  other: 'Autre',
}

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-amber-50 text-amber-700',
  under_review: 'bg-blue-50 text-blue-700',
  resolved_refunded: 'bg-emerald-50 text-emerald-700',
  resolved_rejected: 'bg-red-50 text-red-700',
  resolved_compensation: 'bg-purple-50 text-purple-700',
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Ouvert',
  under_review: 'En cours',
  resolved_refunded: 'Rembourse',
  resolved_rejected: 'Rejete',
  resolved_compensation: 'Compense',
}

export default async function DisputesAdminPage() {
  const supabase = createSupabaseServerClient()

  const { data: disputes } = await supabase
    .from('disputes')
    .select('id, booking_id, reporter_id, reported_user_id, type, status, description, photos, admin_notes, resolution, refund_amount, created_at, resolved_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const allDisputes = disputes ?? []
  const openCount = allDisputes.filter((d) => d.status === 'open').length

  // Fetch reporter user info
  const reporterIds = Array.from(new Set(allDisputes.map((d) => d.reporter_id).filter(Boolean)))
  const { data: reporters } = reporterIds.length > 0
    ? await supabase.from('users').select('id, email, full_name').in('id', reporterIds)
    : { data: [] as { id: string; email: string; full_name: string }[] }
  const reporterMap = new Map((reporters ?? []).map((u) => [u.id, { email: u.email, name: u.full_name }]))

  // Fetch booking → spot info
  const bookingIds = Array.from(new Set(allDisputes.map((d) => d.booking_id).filter(Boolean)))
  const { data: bookings } = bookingIds.length > 0
    ? await supabase.from('bookings').select('id, spot_id').in('id', bookingIds)
    : { data: [] as { id: string; spot_id: string }[] }
  const bookingMap = new Map((bookings ?? []).map((b) => [b.id, b.spot_id]))

  const spotIds = Array.from(new Set((bookings ?? []).map((b) => b.spot_id).filter(Boolean)))
  const { data: spots } = spotIds.length > 0
    ? await supabase.from('spots').select('id, title').in('id', spotIds)
    : { data: [] as { id: string; title: string }[] }
  const spotMap = new Map((spots ?? []).map((s) => [s.id, s.title]))

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-xl px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Litiges</h1>
            <p className="text-sm text-gray-400">{openCount} litige(s) ouvert(s)</p>
          </div>
        </header>
        <div className="p-8">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-5 py-3 text-left">Plaignant</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left">Place</th>
                  <th className="px-5 py-3 text-left">Statut</th>
                  <th className="px-5 py-3 text-left">Cree le</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allDisputes.map((dispute) => {
                  const reporter = reporterMap.get(dispute.reporter_id)
                  const spotId = dispute.booking_id ? bookingMap.get(dispute.booking_id) : null
                  const spotTitle = spotId ? spotMap.get(spotId) : null

                  return (
                    <tr key={dispute.id} className="hover:bg-gray-50/50 transition-colors align-top">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{reporter?.name ?? '—'}</p>
                        <p className="text-xs text-gray-400">{reporter?.email ?? dispute.reporter_id}</p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {TYPE_LABELS[dispute.type] ?? dispute.type}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {spotTitle ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[dispute.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {STATUS_LABEL[dispute.status] ?? dispute.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        {new Date(dispute.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-5 py-4">
                        <DisputeActions
                          disputeId={dispute.id}
                          bookingId={dispute.booking_id}
                          status={dispute.status}
                          description={dispute.description ?? ''}
                          photos={dispute.photos}
                          reportedUserId={dispute.reported_user_id}
                        />
                      </td>
                    </tr>
                  )
                })}
                {!allDisputes.length && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                      Aucun litige enregistre
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
