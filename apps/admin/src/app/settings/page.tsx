import { Sidebar } from '../../components/sidebar'

export const dynamic = 'force-dynamic'

const PLATFORM_SETTINGS = [
  { label: 'Commission plateforme', value: '15%', description: 'Pourcentage preleve sur chaque reservation' },
  { label: 'Commission hote', value: '85%', description: 'Pourcentage reverse au proprietaire de la place' },
  { label: 'Devise', value: 'EUR', description: 'Devise principale de la plateforme' },
  { label: 'Pays', value: 'France', description: 'Pays de lancement' },
  { label: 'Villes supportees', value: 'Nice', description: 'Villes actuellement couvertes par le service' },
  { label: 'Duree min. reservation', value: '1 heure', description: 'Duree minimale pour une reservation' },
  { label: 'Delai annulation gratuite', value: '24 heures', description: 'Delai avant le debut pour annuler sans frais' },
  { label: 'Passerelle de paiement', value: 'Stripe', description: 'Fournisseur de paiement utilise' },
]

const FEATURE_FLAGS = [
  { label: 'Reservation instantanee', enabled: true },
  { label: 'Smart Gate (IoT)', enabled: true },
  { label: 'Paiement par carte', enabled: true },
  { label: 'Avis et notes', enabled: true },
  { label: 'Notifications push', enabled: false },
  { label: 'Chat in-app', enabled: false },
]

export default function SettingsAdminPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-xl px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Parametres</h1>
            <p className="text-sm text-gray-400">Configuration de la plateforme</p>
          </div>
        </header>
        <div className="p-8">
          <div className="grid grid-cols-2 gap-6">
            {/* Platform settings */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="font-semibold text-[#1A1A2E]">Configuration Plateforme</h2>
                <p className="text-xs text-gray-400 mt-0.5">Parametres en lecture seule</p>
              </div>
              <div className="divide-y divide-gray-50">
                {PLATFORM_SETTINGS.map(({ label, value, description }) => (
                  <div key={label} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                      </div>
                      <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-semibold text-[#1A1A2E]">
                        {value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature flags */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h2 className="font-semibold text-[#1A1A2E]">Fonctionnalites</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Etat des fonctionnalites de la plateforme</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {FEATURE_FLAGS.map(({ label, enabled }) => (
                    <div key={label} className="flex items-center justify-between px-6 py-3.5">
                      <span className="text-sm text-gray-700">{label}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          enabled
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {enabled ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Environment info */}
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h2 className="font-semibold text-[#1A1A2E]">Environnement</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    { label: 'Environnement', value: process.env.NODE_ENV ?? 'development' },
                    { label: 'Base de donnees', value: 'Supabase (PostgreSQL)' },
                    { label: 'Hebergement', value: 'Vercel' },
                    { label: 'Version', value: '0.1.0 (MVP)' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between px-6 py-3.5">
                      <span className="text-sm text-gray-600">{label}</span>
                      <span className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-mono text-gray-500">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
