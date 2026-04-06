import { createSupabaseServerClient } from '../../lib/supabase/server'
import { Sidebar } from '../../components/sidebar'
import { VerificationActions } from './verification-actions'

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

export default async function VerificationAdminPage() {
  const supabase = createSupabaseServerClient()

  const { data: docs } = await supabase
    .from('verification_documents')
    .select('id, user_id, type, file_url, status, admin_notes, created_at, reviewed_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const allDocs = docs ?? []
  const pendingCount = allDocs.filter((d) => d.status === 'pending').length

  // Fetch user emails
  const userIds = Array.from(new Set(allDocs.map((d) => d.user_id).filter(Boolean)))
  const { data: users } = userIds.length > 0
    ? await supabase.from('users').select('id, email, full_name').in('id', userIds)
    : { data: [] as { id: string; email: string; full_name: string }[] }
  const userMap = new Map((users ?? []).map((u) => [u.id, { email: u.email, name: u.full_name }]))

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-xl px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Verification KYC</h1>
            <p className="text-sm text-gray-400">{pendingCount} document(s) en attente de verification</p>
          </div>
        </header>
        <div className="p-8">
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
        </div>
      </main>
    </div>
  )
}
