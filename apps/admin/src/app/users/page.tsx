import Link from 'next/link'
import { createSupabaseServerClient } from '../../lib/supabase/server'
import { Sidebar } from '../../components/sidebar'

export const dynamic = 'force-dynamic'

const ROLE_STYLE: Record<string, string> = {
  driver: 'bg-blue-50 text-blue-700',
  host: 'bg-emerald-50 text-emerald-700',
  both: 'bg-purple-50 text-purple-700',
  admin: 'bg-gray-100 text-gray-600',
}

const ROLE_LABELS: Record<string, string> = {
  driver: 'Conducteur', host: 'Hôte', both: 'Cond. & Hôte', admin: 'Admin',
}

export default async function UsersAdminPage({ searchParams }: { searchParams: { page?: string; role?: string } }) {
  const supabase = createSupabaseServerClient()
  const page = Math.max(1, Number(searchParams.page ?? 1))
  const role = searchParams.role ?? ''
  const pageSize = 30
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('users')
    .select('id, email, full_name, role, is_verified, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (role) query = query.eq('role', role)

  const { data: users, count } = await query
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  const ROLE_FILTERS = [
    { value: '', label: 'Tous' },
    { value: 'driver', label: 'Conducteurs' },
    { value: 'host', label: 'Hôtes' },
    { value: 'both', label: 'Les deux' },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-xl px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Utilisateurs</h1>
            <p className="text-sm text-gray-400">Gestion des comptes utilisateurs</p>
          </div>
        </header>
        <div className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">{count ?? 0} utilisateur(s)</p>
            <div className="flex gap-2">
              {ROLE_FILTERS.map((f) => (
                <Link
                  key={f.value}
                  href={f.value ? `/users?role=${f.value}` : '/users'}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    role === f.value
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
                  <th className="px-5 py-3 text-left">Nom</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Rôle</th>
                  <th className="px-5 py-3 text-left">Vérifié</th>
                  <th className="px-5 py-3 text-left">Inscrit le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users?.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{user.full_name || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{user.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLE[user.role] ?? 'bg-gray-100 text-gray-500'}`}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={user.is_verified ? 'text-emerald-600' : 'text-gray-400'}>
                        {user.is_verified ? '✓ Vérifié' : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
                {!users?.length && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
                      Aucun utilisateur
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2">
              {page > 1 && (
                <Link href={`/users?${role ? `role=${role}&` : ''}page=${page - 1}`}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  ← Précédent
                </Link>
              )}
              <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
              {page < totalPages && (
                <Link href={`/users?${role ? `role=${role}&` : ''}page=${page + 1}`}
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
