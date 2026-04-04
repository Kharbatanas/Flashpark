import { Sidebar } from '../../components/sidebar'

export const dynamic = 'force-dynamic'

export default function SupportAdminPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-xl px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Support</h1>
            <p className="text-sm text-gray-400">Gestion des tickets et demandes</p>
          </div>
        </header>
        <div className="p-8">
          {/* Status card */}
          <div className="mb-8 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-emerald-800">Aucun ticket en attente</p>
                <p className="text-sm text-emerald-600">Tous les tickets ont ete traites</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Contact info */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-[#1A1A2E]">Coordonnees Support</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                    <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm font-medium text-gray-900">support@flashpark.fr</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Telephone</p>
                    <p className="text-sm font-medium text-gray-900">+33 4 XX XX XX XX</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                    <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Adresse</p>
                    <p className="text-sm font-medium text-gray-900">Nice, France</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Placeholder stats */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-[#1A1A2E]">Statistiques Support</h2>
              <div className="space-y-4">
                {[
                  { label: 'Tickets ouverts', value: '0', color: 'text-emerald-600' },
                  { label: 'Temps de reponse moyen', value: '—', color: 'text-gray-500' },
                  { label: 'Tickets resolus (30j)', value: '0', color: 'text-gray-500' },
                  { label: 'Satisfaction client', value: '—', color: 'text-gray-500' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className={`text-sm font-bold ${color}`}>{value}</span>
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
