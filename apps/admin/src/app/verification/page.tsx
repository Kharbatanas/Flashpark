import { createSupabaseServerClient } from '../../lib/supabase/server'
import { Sidebar } from '../../components/sidebar'
import { VerificationActions } from './verification-actions'
import { SpotVerificationActions } from './spot-verification-actions'

export const dynamic = 'force-dynamic'

const TYPE_LABELS: Record<string, string> = {
  id_card: 'Carte d\'identite',
  passport: 'Passeport',
  drivers_license: 'Permis de conduire',
  proof_of_address: 'Justificatif de domicile',
  property_proof: 'Justificatif de propriete',
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
}

const SIZE_STYLE: Record<string, string> = {
  small: 'bg-sky-50 text-sky-700',
  medium: 'bg-indigo-50 text-indigo-700',
  large: 'bg-violet-50 text-violet-700',
  xl: 'bg-fuchsia-50 text-fuchsia-700',
}

const SIZE_LABEL: Record<string, string> = {
  small: 'Petit',
  medium: 'Moyen',
  large: 'Grand',
  xl: 'Tres grand',
}

const CANCEL_LABEL: Record<string, string> = {
  flexible: 'Flexible',
  moderate: 'Moderee',
  strict: 'Stricte',
}

export default async function VerificationAdminPage() {
  const supabase = createSupabaseServerClient()

  const { data: docs } = await supabase
    .from('verification_documents')
    .select('id, user_id, type, file_url, status, admin_notes, created_at, reviewed_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const allDocs = docs ?? []
  const pendingCount = allDocs.filter((d) => d.status === 'pending').length

  // Fetch user emails for KYC docs
  const userIds = Array.from(new Set(allDocs.map((d) => d.user_id).filter(Boolean)))
  const { data: kycUsers } = userIds.length > 0
    ? await supabase.from('users').select('id, email, full_name').in('id', userIds)
    : { data: [] as { id: string; email: string; full_name: string }[] }
  const userMap = new Map((kycUsers ?? []).map((u) => [u.id, { email: u.email, name: u.full_name }]))

  // Fetch spots pending review
  const { data: pendingSpots } = await supabase
    .from('spots')
    .select('id, host_id, title, address, photos, description, width, length, max_vehicle_height, size_category, cancellation_policy, access_instructions, ownership_proof_url, created_at')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false })
    .limit(50)

  const allPendingSpots = pendingSpots ?? []
  const pendingSpotsCount = allPendingSpots.length

  // Fetch host info for spots
  const hostIds = Array.from(new Set(allPendingSpots.map((s) => s.host_id).filter(Boolean)))
  const { data: hosts } = hostIds.length > 0
    ? await supabase.from('users').select('id, email, full_name').in('id', hostIds)
    : { data: [] as { id: string; email: string; full_name: string }[] }
  const hostMap = new Map((hosts ?? []).map((h) => [h.id, { email: h.email, name: h.full_name }]))

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-xl px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Verification</h1>
            <p className="text-sm text-gray-400">
              {pendingCount} document(s) KYC en attente · {pendingSpotsCount} annonce(s) a verifier
            </p>
          </div>
        </header>
        <div className="p-8 space-y-8">
          {/* KYC Documents */}
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Verification KYC
            </h2>
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="px-5 py-3 text-left">Utilisateur</th>
                    <th className="px-5 py-3 text-left">Type</th>
                    <th className="px-5 py-3 text-left">Statut</th>
                    <th className="px-5 py-3 text-left">Soumis le</th>
                    <th className="px-5 py-3 text-left">Document</th>
                    <th className="px-5 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allDocs.map((doc) => {
                    const user = userMap.get(doc.user_id)
                    return (
                      <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-gray-900">{user?.name ?? '—'}</p>
                          <p className="text-xs text-gray-400">{user?.email ?? doc.user_id}</p>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">{TYPE_LABELS[doc.type] ?? doc.type}</td>
                        <td className="px-5 py-3.5">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[doc.status] ?? 'bg-gray-100 text-gray-500'}`}>
                            {doc.status === 'pending' ? 'En attente' : doc.status === 'approved' ? 'Approuve' : 'Rejete'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">
                          {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-5 py-3.5">
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs font-medium text-[#0540FF] hover:underline">
                            Voir le document
                          </a>
                        </td>
                        <td className="px-5 py-3.5">
                          <VerificationActions docId={doc.id} currentStatus={doc.status} />
                        </td>
                      </tr>
                    )
                  })}
                  {!allDocs.length && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                        Aucun document de verification
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Spot Verification */}
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Verification des annonces
            </h2>
            {allPendingSpots.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-12 text-center text-sm text-gray-400">
                Aucune annonce en attente de verification
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {allPendingSpots.map((spot) => {
                  const host = hostMap.get(spot.host_id)
                  const firstPhoto = spot.photos?.[0] ?? null

                  return (
                    <div key={spot.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col">
                      {/* Photo */}
                      <div className="h-36 bg-gray-100 overflow-hidden">
                        {firstPhoto ? (
                          <img
                            src={firstPhoto}
                            alt={spot.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-300 text-3xl">
                            🅿️
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 space-y-3">
                        <div>
                          <p className="font-semibold text-[#1A1A2E] text-sm leading-snug">{spot.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{spot.address}</p>
                        </div>

                        {/* Host */}
                        <div>
                          <p className="text-xs font-medium text-gray-700">{host?.name ?? '—'}</p>
                          <p className="text-xs text-gray-400">{host?.email ?? spot.host_id}</p>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5">
                          {spot.size_category && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SIZE_STYLE[spot.size_category] ?? 'bg-gray-100 text-gray-500'}`}>
                              {SIZE_LABEL[spot.size_category] ?? spot.size_category}
                            </span>
                          )}
                          {spot.cancellation_policy && (
                            <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                              {CANCEL_LABEL[spot.cancellation_policy] ?? spot.cancellation_policy}
                            </span>
                          )}
                        </div>

                        {/* Dimensions */}
                        {(spot.width || spot.length || spot.max_vehicle_height) && (
                          <p className="text-xs text-gray-500">
                            {[
                              spot.width && spot.length ? `${spot.width} × ${spot.length} m` : null,
                              spot.max_vehicle_height ? `Haut. max ${spot.max_vehicle_height} m` : null,
                            ].filter(Boolean).join(' · ')}
                          </p>
                        )}

                        {/* Access instructions */}
                        {spot.access_instructions && (
                          <p className="text-xs text-gray-500 line-clamp-2 italic">
                            &quot;{spot.access_instructions}&quot;
                          </p>
                        )}

                        {/* Ownership proof */}
                        {spot.ownership_proof_url && (
                          <a
                            href={spot.ownership_proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-[#0540FF] hover:underline block"
                          >
                            Voir le justificatif
                          </a>
                        )}

                        {/* Date */}
                        <p className="text-xs text-gray-400">
                          Soumis le {new Date(spot.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="border-t border-gray-100 p-4">
                        <SpotVerificationActions spotId={spot.id} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
